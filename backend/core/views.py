import json
import os
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import CustomUser, Conversation, Message

# Gemini
import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)


# ---------------------------------------------------------
# 🔵 SYNC USER (NextAuth → Django user creation)
# ---------------------------------------------------------
@csrf_exempt
def sync_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    body = json.loads(request.body)
    email = body.get("email")

    if not email:
        return JsonResponse({"error": "Email required"}, status=400)

    user, created = CustomUser.objects.get_or_create(
        email=email,
        defaults={
            "username": email.split("@")[0],
            "is_google_account": True,
        },
    )

    return JsonResponse({"user_id": user.id})


# ---------------------------------------------------------
# 🔵 START CALL (ElevenLabs AI calling)
# ---------------------------------------------------------
@csrf_exempt
def start_call(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")
    ELEVEN_AGENT_ID = os.getenv("ELEVEN_AGENT_ID")
    ELEVEN_FROM_NUMBER = os.getenv("ELEVEN_FROM_NUMBER")

    if not ELEVEN_API_KEY or not ELEVEN_AGENT_ID or not ELEVEN_FROM_NUMBER:
        return JsonResponse(
            {"error": "Missing ElevenLabs configuration"},
            status=500
        )

    try:
        data = json.loads(request.body)
        to_number = data.get("phone")
        name = data.get("name", "")
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not to_number:
        return JsonResponse({"error": "Missing phone number"}, status=400)

    # ElevenLabs API endpoint
    url = f"https://api.elevenlabs.io/v1/agents/{ELEVEN_AGENT_ID}/call"

    payload = {
        "phone_number": to_number,
        "from_number": ELEVEN_FROM_NUMBER,
    }

    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    try:
        return JsonResponse(response.json(), status=response.status_code)
    except:
        return JsonResponse({"error": "ElevenLabs API returned invalid response"}, status=500)


# ---------------------------------------------------------
# 🔵 CHAT ENDPOINT (Gemini AI)
# ---------------------------------------------------------
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

    # Fetch user
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    # Fetch or create conversation
    if conv_id:
        try:
            conversation = Conversation.objects.get(id=conv_id, user=user)
        except Conversation.DoesNotExist:
            return JsonResponse({"error": "Conversation not found"}, status=404)
    else:
        conversation = Conversation.objects.create(user=user, title="New Chat")

    # Save user's message
    Message.objects.create(
        conversation=conversation,
        role="user",
        content=message
    )

    # Update title on first message
    if conversation.title == "New Chat" and message.strip():
        conversation.title = message[:50]
        conversation.save()

    # Gemini response
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(message)
        reply_text = response.text or "⚠️ No response from Kai"
    except Exception as e:
        reply_text = f"⚠️ Error: {str(e)}"

    # Save assistant reply
    Message.objects.create(
        conversation=conversation,
        role="assistant",
        content=reply_text
    )

    return JsonResponse({
        "conversation_id": conversation.id,
        "reply": reply_text,
        "title": conversation.title,
    })


# ---------------------------------------------------------
# 🔵 HISTORY ENDPOINT
# ---------------------------------------------------------
def get_history(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    conversations = []
    for conv in user.conversations.all().order_by("-created_at"):
        conversations.append({
            "conversation_id": conv.id,
            "title": conv.title,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp,
                }
                for msg in conv.messages.all().order_by("timestamp")
            ],
        })

    return JsonResponse(conversations, safe=False)