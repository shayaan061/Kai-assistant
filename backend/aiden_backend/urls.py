from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),  # ✅ now /api/chat/ and /api/parse-request/ work
]
