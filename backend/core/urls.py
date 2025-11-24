from django.urls import path
from .views import (
    sync_user,
    chat,
    get_history,
    start_call
)

urlpatterns = [
    path("sync-user/", sync_user),                        # POST → NextAuth sync
    path("chat/", chat),                                  # POST → Gemini chat
    path("history/<int:user_id>/", get_history),          # GET → chat history
    path("start-call/", start_call),                      # POST → Start ElevenLabs call
]