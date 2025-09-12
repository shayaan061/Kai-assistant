from django.urls import path
from .views import parse_request, chat

urlpatterns = [
    path("parse-request/", parse_request),
    path("chat/", chat),
]
