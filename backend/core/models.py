from django.db import models
from django.contrib.auth.models import User


class Conversation(models.Model):
    """
    A conversation belongs to a single user and can have many messages.
    Example: "Weekend plans", "Work tasks", etc.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations")
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Message(models.Model):
    """
    A message belongs to a conversation. It can be from the user or Kai (assistant).
    """
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(
        max_length=20,
        choices=[("user", "User"), ("assistant", "Assistant")],
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.content[:30]}"
