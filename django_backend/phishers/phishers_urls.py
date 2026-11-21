from django.urls import include, path
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token

from . import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"groups", views.GroupViewSet)
router.register(r"monitored_users", views.MonitoredUsers)
router.register(
    r"monitored_user_details",
    views.MonitoredUserDetailsViewSet,
    basename="monitored_user_details",
)
router.register(r"user_details", views.UserDetailsViewSet, basename="user_details")
router.register(
    r"user_read_books", views.UserReadBooksViewSet, basename="user_read_books"
)
router.register(r"timestamps", views.TimestampViewSet, basename="timestamps")
router.register(r"todos", views.TodoViewSet, basename="todos")
router.register(r"canals", views.CanalViewSet, basename="canals")
router.register(r"videos", views.VideoViewSet, basename="videos")
router.register(
    r"video_checkpoints",
    views.VideoCheckpointViewSet,
    basename="video_checkpoints",
)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/token/", obtain_auth_token, name="api_token_auth"),
    path("auth/logout/", views.TokenLogoutView.as_view(), name="api_token_logout"),
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
