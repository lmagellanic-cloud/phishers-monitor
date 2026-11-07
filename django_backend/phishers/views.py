import posixpath
from pathlib import Path

from django.contrib.auth.models import Group, User
from django.core.files.storage import default_storage
from django.http import FileResponse
from django.shortcuts import redirect
from rest_framework import permissions, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from phishers.models import MonitoredUser
from phishers.serializers import (
    GroupSerializer,
    MonitoredUserSerializer,
    UserSerializer,
)


def index(request):
    return redirect("phishers/")


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """

    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class MonitoredUsers(viewsets.ModelViewSet):
    queryset = MonitoredUser.objects.all()
    serializer_class = MonitoredUserSerializer
    permission_classes = []  # TODO: Migrado Flask, activar autenticación


def _clean_media_path(value):
    if not isinstance(value, str) or "\0" in value:
        raise ValueError("La ruta no es válida.")

    path = value.strip().replace("\\", "/")
    if path.startswith("/") or (len(path) > 1 and path[1] == ":"):
        raise ValueError("La ruta debe estar dentro de media.")
    if ".." in path.split("/"):
        raise ValueError("La ruta debe estar dentro de media.")

    normalized_path = posixpath.normpath(path)
    return "" if normalized_path == "." else normalized_path


def _is_media_file(path):
    directory, filename = posixpath.split(path)
    try:
        _, filenames = default_storage.listdir(directory)
    except (OSError, NotImplementedError):
        return False
    return filename in filenames


class FilesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            directory = _clean_media_path(request.query_params.get("path", ""))
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            directories, filenames = default_storage.listdir(directory)
        except (FileNotFoundError, NotADirectoryError):
            return Response(
                {"detail": "La carpeta no existe."}, status=status.HTTP_404_NOT_FOUND
            )

        folder_list = [
            {"name": name, "path": posixpath.join(directory, name)}
            for name in sorted(directories, key=str.lower)
        ]
        file_list = [
            {
                "name": filename,
                "path": posixpath.join(directory, filename),
                "size": default_storage.size(posixpath.join(directory, filename)),
                "modified": default_storage.get_modified_time(
                    posixpath.join(directory, filename)
                ).isoformat(),
            }
            for filename in filenames
        ]
        file_list.sort(key=lambda item: item["name"].lower())
        return Response({"path": directory, "folders": folder_list, "files": file_list})

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            return Response(
                {"detail": "No se ha recibido ningún fichero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            directory = _clean_media_path(request.data.get("path", ""))
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        filename = default_storage.save(
            posixpath.join(directory, uploaded_file.name), uploaded_file
        )
        return Response({"name": filename}, status=status.HTTP_201_CREATED)


class FileFolderCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            parent = _clean_media_path(request.data.get("path", ""))
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        name = request.data.get("name")
        if (
            not isinstance(name, str)
            or not name.strip()
            or name.strip() in {".", ".."}
            or "/" in name
            or "\\" in name
            or "\0" in name
            or ":" in name
        ):
            return Response(
                {"detail": "El nombre de carpeta no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = name.strip()
        try:
            default_storage.listdir(parent)
        except (FileNotFoundError, NotADirectoryError):
            return Response(
                {"detail": "La carpeta de destino no existe."},
                status=status.HTTP_404_NOT_FOUND,
            )

        folder_path = posixpath.join(parent, name)
        try:
            Path(default_storage.path(folder_path)).mkdir()
        except FileExistsError:
            return Response(
                {"detail": "Ya existe un archivo o carpeta con ese nombre."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"name": name, "path": folder_path}, status=status.HTTP_201_CREATED
        )


class FileDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, filename):
        try:
            filename = _clean_media_path(filename)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        if not _is_media_file(filename):
            return Response(
                {"detail": "El fichero no existe."}, status=status.HTTP_404_NOT_FOUND
            )

        return FileResponse(
            default_storage.open(filename, "rb"), as_attachment=True, filename=filename
        )


class FileDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, filename):
        try:
            filename = _clean_media_path(filename)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        if not _is_media_file(filename):
            return Response(
                {"detail": "El fichero no existe."}, status=status.HTTP_404_NOT_FOUND
            )

        default_storage.delete(filename)
        return Response(status=status.HTTP_204_NO_CONTENT)
