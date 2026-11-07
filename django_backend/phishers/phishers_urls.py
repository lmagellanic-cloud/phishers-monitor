from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"groups", views.GroupViewSet)
router.register(r"monitored_users", views.MonitoredUsers)

urlpatterns = [
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("files/", views.FilesView.as_view(), name="files"),
    path(
        "files/folders/",
        views.FileFolderCreateView.as_view(),
        name="create_file_folder",
    ),
    path(
        "files/<path:filename>/download/",
        views.FileDownloadView.as_view(),
        name="download_file",
    ),
    path(
        "files/<path:filename>/",
        views.FileDeleteView.as_view(),
        name="delete_file",
    ),
    path(
        "monitored_users/",
        views.MonitoredUsers.as_view({"get": "list"}),
        name="monitored_users",
    ),
]
