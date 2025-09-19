import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import CustomUser, Conversation, Message

import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)

# ✅ Sync user (called from NextAuth session callback)
@csrf_exempt
def sync_user(request):
    if request.method == "POST":
        body = json.loads(request.body)
        email = body.get("email")

        if not email:
            return JsonResponse({"error": "Email required"}, status=400)

        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={"username": email.split("@")[0], "is_google_account": True},
        )
        return JsonResponse({"user_id": user.id})

    return JsonResponse({"error": "Invalid method"}, status=405)


# ✅ Chat endpoint
@csrf_exempt
def chat(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_id = data.get("user_id")
        conv_id = data.get("conversation_id")
        message = data.get("message")

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        if conv_id:
            try:
                conversation = Conversation.objects.get(id=conv_id, user=user)
            except Conversation.DoesNotExist:
                return JsonResponse({"error": "Conversation not found"}, status=404)
        else:
            conversation = Conversation.objects.create(user=user, title="New Chat")

        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation, role="user", content=message
        )

        # ✅ If conversation still has default title, update it to the first message
        if conversation.title == "New Chat" and message.strip():
            conversation.title = message[:50]  # keep titles short
            conversation.save()
        # Send to Gemini
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(message)
            reply_text = response.text or "⚠ No response from Kai"
        except Exception as e:
            reply_text = f"⚠ Error: {str(e)}"

        # Save assistant reply
        Message.objects.create(
            conversation=conversation, role="assistant", content=reply_text
        )

        return JsonResponse(
            {
                "conversation_id": conversation.id,
                "reply": reply_text,
                "title": conversation.title,  # ✅ return updated title too
            }
        )

    return JsonResponse({"error": "Invalid method"}, status=405)



# ✅ Get chat history
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
                {"role": msg.role, "content": msg.content, "timestamp": msg.timestamp}
                for msg in conv.messages.all().order_by("timestamp")
            ],
        })

    return JsonResponse(conversations, safe=False)
