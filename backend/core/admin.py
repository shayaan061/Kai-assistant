from django.contrib import admin
from .models import CustomUser, Conversation, Message

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "is_google_account", "is_staff", "is_superuser")
    search_fields = ("username", "email")

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "created_at")
    search_fields = ("title", "user__email")

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "content", "timestamp")
    search_fields = ("content",)
    list_filter = ("role", "timestamp")
