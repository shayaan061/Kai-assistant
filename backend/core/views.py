from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import CustomUser, Conversation, Message
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


@api_view(["POST"])
def sync_user(request):
    """Ensure user exists (used by NextAuth)"""
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email required"}, status=400)

    user, created = CustomUser.objects.get_or_create(email=email, defaults={"username": email, "is_google_account": True})
    return Response({"user_id": user.id})


@api_view(["POST"])
def chat(request):
    """Chat with AI and save messages"""
    user_id = request.data.get("user_id")
    message = request.data.get("message")
    conversation_id = request.data.get("conversation_id")

    if not message:
        return Response({"error": "Message required"}, status=400)

    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if conversation_id:
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=404)
    else:
        conversation = Conversation.objects.create(user=user, title=message[:30])

    # Save user message
    Message.objects.create(conversation=conversation, role="user", content=message)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        ai_response = model.generate_content(message).text
    except Exception as e:
        ai_response = f"⚠️ Gemini error: {str(e)}"

    Message.objects.create(conversation=conversation, role="assistant", content=ai_response)

    return Response({"reply": ai_response, "conversation_id": conversation.id})


@api_view(["GET"])
def get_history(request, user_id):
    """Get all conversations + messages for a user"""
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    conversations = []
    for convo in user.conversations.all().order_by("-created_at"):
        conversations.append({
            "conversation_id": convo.id,
            "title": convo.title,
            "messages": [
                {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
                for m in convo.messages.all().order_by("timestamp")
            ],
        })
    return Response(conversations)
