import hashlib
import tempfile

from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient


class LocalFilesApiTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.storage_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.storage_override.enable()
        self.client = APIClient()
        self.user = User.objects.create_user(username="api-user", password="test-pass")
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        self.storage_override.disable()
        self.media_directory.cleanup()

    def test_api_endpoints_require_authentication(self):
        anonymous_client = APIClient()
        endpoints = [
            ("get", reverse("user-list")),
            ("get", reverse("group-list")),
            ("get", reverse("files")),
            ("post", reverse("files")),
            ("post", reverse("create_file_folder")),
            ("get", reverse("monitored_users")),
            ("get", reverse("download_file", args=["missing.txt"])),
            ("delete", reverse("delete_file", args=["missing.txt"])),
        ]

        for method, url in endpoints:
            with self.subTest(method=method, url=url):
                response = getattr(anonymous_client, method)(url)
                self.assertEqual(response.status_code, 401)

    def test_token_endpoint_authenticates_user(self):
        response = self.client.post(
            reverse("api_token_auth"),
            {"username": "api-user", "password": "test-pass"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

    def test_token_logout_revokes_token(self):
        token_response = APIClient().post(
            reverse("api_token_auth"),
            {"username": "api-user", "password": "test-pass"},
            format="json",
        )
        token_client = APIClient(
            HTTP_AUTHORIZATION=f"Token {token_response.data['token']}"
        )

        authenticated_response = token_client.get(reverse("files"))
        logout_response = token_client.post(reverse("api_token_logout"))
        files_response = token_client.get(reverse("files"))

        self.assertEqual(authenticated_response.status_code, 200)
        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(files_response.status_code, 401)

    def test_upload_list_download_and_delete_file(self):
        upload_response = self.client.post(
            reverse("files"),
            {"file": SimpleUploadedFile("notes.txt", b"local cloud content")},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 201)
        filename = upload_response.data["name"]
        self.assertEqual(
            upload_response.data["md5"],
            hashlib.md5(b"local cloud content").hexdigest(),
        )

        list_response = self.client.get(reverse("files"))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["files"][0]["name"], filename)

        download_response = self.client.get(reverse("download_file", args=[filename]))
        self.assertEqual(download_response.status_code, 200)
        self.assertEqual(
            download_response["X-Content-MD5"], upload_response.data["md5"]
        )
        self.assertEqual(
            b"".join(download_response.streaming_content), b"local cloud content"
        )

        delete_response = self.client.delete(reverse("delete_file", args=[filename]))
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(default_storage.exists(filename))

    def test_download_supports_byte_ranges(self):
        upload_response = self.client.post(
            reverse("files"),
            {"file": SimpleUploadedFile("clip.mp4", b"0123456789")},
            format="multipart",
        )

        response = self.client.get(
            reverse("download_file", args=[upload_response.data["name"]]),
            HTTP_RANGE="bytes=2-5",
        )

        self.assertEqual(response.status_code, 206)
        self.assertEqual(response["Accept-Ranges"], "bytes")
        self.assertEqual(response["Content-Range"], "bytes 2-5/10")
        self.assertEqual(response["Content-Length"], "4")
        self.assertEqual(b"".join(response.streaming_content), b"2345")

    def test_create_folder_and_manage_files_inside_it(self):
        folder_response = self.client.post(
            reverse("create_file_folder"), {"path": "", "name": "reports"}
        )

        self.assertEqual(folder_response.status_code, 201)
        self.assertEqual(folder_response.data["path"], "reports")

        upload_response = self.client.post(
            reverse("files"),
            {
                "path": "reports",
                "file": SimpleUploadedFile("summary.txt", b"nested content"),
            },
            format="multipart",
        )
        self.assertEqual(upload_response.status_code, 201)
        self.assertEqual(upload_response.data["name"], "reports/summary.txt")
        self.assertEqual(
            upload_response.data["md5"], hashlib.md5(b"nested content").hexdigest()
        )

        root_response = self.client.get(reverse("files"))
        self.assertEqual(root_response.data["folders"][0]["path"], "reports")

        nested_response = self.client.get(reverse("files"), {"path": "reports"})
        self.assertEqual(nested_response.status_code, 200)
        self.assertEqual(
            nested_response.data["files"][0]["path"], "reports/summary.txt"
        )

        download_response = self.client.get(
            reverse("download_file", args=["reports/summary.txt"])
        )
        self.assertEqual(download_response.status_code, 200)
        self.assertEqual(
            download_response["X-Content-MD5"], upload_response.data["md5"]
        )
        self.assertEqual(
            b"".join(download_response.streaming_content), b"nested content"
        )

    def test_paths_cannot_escape_media_root(self):
        listing_response = self.client.get(reverse("files"), {"path": "../outside"})
        self.assertEqual(listing_response.status_code, 400)

        folder_response = self.client.post(
            reverse("create_file_folder"), {"path": "", "name": "../outside"}
        )
        self.assertEqual(folder_response.status_code, 400)
