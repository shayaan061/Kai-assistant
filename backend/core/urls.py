from django.urls import path
from .views import sync_user, chat, get_history

urlpatterns = [
    path("sync-user/", sync_user),
    path("chat/", chat),
    path("history/<int:user_id>/", get_history),
]
