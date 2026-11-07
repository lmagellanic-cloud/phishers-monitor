import tempfile

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

    def tearDown(self):
        self.storage_override.disable()
        self.media_directory.cleanup()

    def test_upload_list_download_and_delete_file(self):
        upload_response = self.client.post(
            reverse("files"),
            {"file": SimpleUploadedFile("notes.txt", b"local cloud content")},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 201)
        filename = upload_response.data["name"]

        list_response = self.client.get(reverse("files"))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["files"][0]["name"], filename)

        download_response = self.client.get(reverse("download_file", args=[filename]))
        self.assertEqual(download_response.status_code, 200)
        self.assertEqual(
            b"".join(download_response.streaming_content), b"local cloud content"
        )

        delete_response = self.client.delete(reverse("delete_file", args=[filename]))
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(default_storage.exists(filename))

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
            b"".join(download_response.streaming_content), b"nested content"
        )

    def test_paths_cannot_escape_media_root(self):
        listing_response = self.client.get(reverse("files"), {"path": "../outside"})
        self.assertEqual(listing_response.status_code, 400)

        folder_response = self.client.post(
            reverse("create_file_folder"), {"path": "", "name": "../outside"}
        )
        self.assertEqual(folder_response.status_code, 400)
