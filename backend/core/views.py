import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import CustomUser, Conversation, Message

import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)

from twilio.rest import Client


# -------------------------------------------------------------------
# 0️⃣ TEST WEBHOOK (for Cloudflare, ngrok, etc.)
# -------------------------------------------------------------------
@csrf_exempt
def test_webhook(request):
    print("\n🔥 TEST WEBHOOK HIT!")
    print("Headers:", dict(request.headers))
    print("Body:", request.body.decode())
    return JsonResponse({"status": "ok"})


# -------------------------------------------------------------------
# 1️⃣ SYNC USER
# -------------------------------------------------------------------
@csrf_exempt
def sync_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    body = json.loads(request.body)
    email = body.get("email")

    if not email:
        return JsonResponse({"error": "Email required"}, status=400)

    user, _ = CustomUser.objects.get_or_create(
        email=email,
        defaults={
            "username": email.split("@")[0],
            "is_google_account": True,
        },
    )

    return JsonResponse({"user_id": user.id})


# -------------------------------------------------------------------
# 2️⃣ START CALL — Twilio → ElevenLabs Voice Agent
# -------------------------------------------------------------------
@csrf_exempt
def start_call(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    data = json.loads(request.body)
    name = data.get("name")
    phone = data.get("phone")

    if not phone:
        return JsonResponse({"error": "Phone number required"}, status=400)

    # Clean number
    phone = phone.replace(" ", "")
    if phone.isnumeric() and not phone.startswith("+"):
        phone = "+91" + phone

    print("📞 OUTBOUND CALL REQUEST →", name or phone)

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # ELEVENLABS TWIML BRIDGE
        twiml_url = (
            "https://api.elevenlabs.io/v1/convai/twilio/"
            + settings.ELEVEN_AGENT_ID
        )

        call = client.calls.create(
            to=phone,
            from_=settings.TWILIO_PHONE_NUMBER,
            url=twiml_url,
        )

        print("📞 CALL STARTED — SID:", call.sid)

        return JsonResponse({
            "status": "calling",
            "phone": phone,
            "sid": call.sid,
        })

    except Exception as e:
        print("❌ CALL ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)


# -------------------------------------------------------------------
# 3️⃣ CHAT (Gemini)
# -------------------------------------------------------------------
@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    data = json.loads(request.body)
    user_id = data.get("user_id")
    conv_id = data.get("conversation_id")
    message = data.get("message")

    if not message:
        return JsonResponse({"error": "Message required"}, status=400)

    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if conv_id:
        conversation = Conversation.objects.filter(id=conv_id, user=user).first()
        if not conversation:
            return JsonResponse({"error": "Conversation not found"}, status=404)
    else:
        conversation = Conversation.objects.create(user=user, title="New Chat")

    # Save user message
    Message.objects.create(conversation=conversation, role="user", content=message)

    # Update conversation title automatically
    if conversation.title == "New Chat":
        conversation.title = message[:50]
        conversation.save()

    # AI response
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(message)
        reply_text = response.text or "I could not generate a response."
    except Exception as e:
        reply_text = f"⚠️ Error: {str(e)}"

    # Save assistant message
    Message.objects.create(conversation=conversation, role="assistant", content=reply_text)

    return JsonResponse({
        "conversation_id": conversation.id,
        "title": conversation.title,
        "reply": reply_text,
    })


# -------------------------------------------------------------------
# 4️⃣ GET CONVERSATION HISTORY
# -------------------------------------------------------------------
def get_history(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    output = []

    for conv in user.conversations.all().order_by("-created_at"):
        output.append({
            "conversation_id": conv.id,
            "title": conv.title,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp,
                }
                for msg in conv.messages.all().order_by("timestamp")
            ]
        })

    return JsonResponse(output, safe=False)


# -------------------------------------------------------------------
# 5️⃣ ELEVENLABS → YOUR BACKEND WEBHOOK
# -------------------------------------------------------------------
@csrf_exempt
def elevenlabs_webhook(request):
    try:
        body_raw = request.body.decode()
        print("\n🔔 ELEVENLABS WEBHOOK HIT")
        print("RAW BODY:", body_raw)

        body = json.loads(body_raw)
        event = body.get("type")
        data = body.get("data", {})

        print("📩 Event:", event)

        # When caller speaks
        if event == "transcription.completed":
            user_text = data.get("transcript", "")
            print("👤 Caller:", user_text)

            model = genai.GenerativeModel("gemini-2.0-flash")
            reply = model.generate_content(user_text).text or "I didn't understand that."

            print("🤖 Reply:", reply)

            return JsonResponse({
                "messages": [
                    {
                        "type": "output_text",
                        "text": reply
                    }
                ]
            })

        # Ping events
        if event == "ping":
            return JsonResponse({"pong": True})

        return JsonResponse({"status": "ok"})

    except Exception as e:
        print("❌ WEBHOOK ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)