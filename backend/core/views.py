from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Conversation, Message
import google.generativeai as genai
from django.conf import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


@api_view(["POST"])
def parse_request(request):
    """Extract intent and entities from user request"""
    user_message = request.data.get("message", "")

    if not user_message:
        return Response({"error": "No message provided"}, status=400)

    prompt = f"""
    Extract intent and entities from the following user request. 
    Return JSON with keys: intent, contact, time (if available).
    User request: "{user_message}"
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return Response({"parsed": response.text})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def chat(request):
    """General chatbot conversation with persistence"""
    user_message = request.data.get("message", "")
    user_id = request.data.get("user_id")
    conversation_id = request.data.get("conversation_id")  # optional

    if not user_message:
        return Response({"error": "No message provided"}, status=400)

    # Get or create user
    if not user_id:
        user, _ = User.objects.get_or_create(username="default")
    else:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    # Continue or create conversation
    if conversation_id:
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=404)
    else:
        conversation = Conversation.objects.create(
            user=user,
            title=user_message[:30] or "New Chat"
        )

    # Save user message
    Message.objects.create(conversation=conversation, role="user", content=user_message)

    try:
        # Get AI response
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(user_message)
        ai_reply = response.text

        # Save assistant message
        Message.objects.create(conversation=conversation, role="assistant", content=ai_reply)

        return Response({
            "reply": ai_reply,
            "conversation_id": conversation.id
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_history(request, user_id):
    """Return all conversations + messages for a user"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    conversations = []
    for convo in Conversation.objects.filter(user=user).order_by("-created_at"):
        conversations.append({
            "conversation_id": convo.id,
            "title": convo.title,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                }
                for msg in convo.messages.all().order_by("timestamp")
            ]
        })

    return Response(conversations)


@api_view(["POST"])
def sync_user(request):
    """Create or fetch a user from email (used by NextAuth)"""
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email required"}, status=400)

    user, created = User.objects.get_or_create(username=email, defaults={"email": email})
    return Response({"user_id": user.id})
