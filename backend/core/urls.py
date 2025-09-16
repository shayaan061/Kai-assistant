from django.urls import path
from .views import chat, parse_request, get_history, sync_user

urlpatterns = [
    path("chat/", chat),
    path("parse-request/", parse_request),
    path("history/<int:user_id>/", get_history),
    path("sync-user/", sync_user),  
]
