from rest_framework.decorators import api_view
from rest_framework.response import Response
import google.generativeai as genai
from django.conf import settings

# configure Gemini
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
    """General chatbot conversation"""
    user_message = request.data.get("message", "")

    if not user_message:
        return Response({"error": "No message provided"}, status=400)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(user_message)
        return Response({"reply": response.text})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
