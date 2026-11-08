import hashlib
import posixpath
from pathlib import Path

from django.contrib.auth.models import Group, User
from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponse
from django.shortcuts import redirect
from rest_framework import status, viewsets
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


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """

    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer


class MonitoredUsers(viewsets.ModelViewSet):
    queryset = MonitoredUser.objects.all()
    serializer_class = MonitoredUserSerializer


class TokenLogoutView(APIView):
    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


def _md5_for_storage(path):
    digest = hashlib.md5()
    with default_storage.open(path, "rb") as stored_file:
        for chunk in iter(lambda: stored_file.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _iter_file_range(stored_file, length):
    while length:
        chunk = stored_file.read(min(64 * 1024, length))
        if not chunk:
            break
        length -= len(chunk)
        yield chunk


class FilesView(APIView):
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
        return Response(
            {"name": filename, "md5": _md5_for_storage(filename)},
            status=status.HTTP_201_CREATED,
        )


class FileFolderCreateView(APIView):
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
    def get(self, request, filename):
        try:
            filename = _clean_media_path(filename)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        if not _is_media_file(filename):
            return Response(
                {"detail": "El fichero no existe."}, status=status.HTTP_404_NOT_FOUND
            )

        file_size = default_storage.size(filename)
        range_header = request.headers.get("Range", "")
        byte_range = None
        if range_header.startswith("bytes=") and "," not in range_header:
            range_start, separator, range_end = range_header[6:].partition("-")
            if separator and (range_start.isdigit() or range_end.isdigit()):
                if range_start.isdigit():
                    start = int(range_start)
                    end = int(range_end) if range_end.isdigit() else file_size - 1
                else:
                    suffix_length = int(range_end)
                    start = max(file_size - suffix_length, 0)
                    end = file_size - 1

                if (
                    file_size == 0
                    or start >= file_size
                    or end < start
                    or (not range_start and int(range_end) == 0)
                ):
                    response = HttpResponse(status=416)
                    response["Content-Range"] = f"bytes */{file_size}"
                    response["Accept-Ranges"] = "bytes"
                    return response
                byte_range = (start, min(end, file_size - 1))

        file = default_storage.open(filename, "rb")
        response = FileResponse(file, as_attachment=True, filename=filename)
        response["Accept-Ranges"] = "bytes"
        if byte_range:
            start, end = byte_range
            file.seek(start)
            response.streaming_content = _iter_file_range(file, end - start + 1)
            response.status_code = 206
            response["Content-Length"] = str(end - start + 1)
            response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        response["X-Content-MD5"] = _md5_for_storage(filename)
        return response


class FileDeleteView(APIView):
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
