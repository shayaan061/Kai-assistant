from django.urls import path
from .views import (
    sync_user,
    chat,
    get_history,
    start_call,
    elevenlabs_webhook,
    test_webhook,
)

urlpatterns = [
    path("sync-user/", sync_user),
    path("chat/", chat),
    path("history/<int:user_id>/", get_history),
    path("start-call/", start_call),

    # ElevenLabs Webhook (HTTPS only via Cloudflare)
    path("webhook/elevenlabs/", elevenlabs_webhook),

    # Test webhook (GET / POST)
    path("test-webhook/", test_webhook),
]