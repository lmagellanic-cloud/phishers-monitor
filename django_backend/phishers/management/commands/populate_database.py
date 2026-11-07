import pathlib
from random import randrange

from django.core.management.base import BaseCommand
from scripts.generate_random_json_files import MEDIA_FOLDER, generate_random_json_files

from phishers.models import MonitoredUser

WORKING_DIR = pathlib.Path(__file__).parent
MONITORED_USER_FOLDER = MEDIA_FOLDER / "monitored_user"
if not MONITORED_USER_FOLDER.is_dir():
    MONITORED_USER_FOLDER.mkdir()


class Command(BaseCommand):
    help = "Populate phishers database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user_counts",
            type=int,
            default=5,
        )

    def handle(self, *args, **options):
        print(f"args={args}, options={options}")

        json_file_paths = generate_random_json_files(
            options["user_counts"], randrange(3, 10), MONITORED_USER_FOLDER
        )

        for json_file_path in json_file_paths:
            print(f"Fichero {json_file_path}...")
            username = json_file_path.stem
            query = MonitoredUser(
                username=username,
                user_data=str(json_file_path.relative_to(MEDIA_FOLDER)),
            )
            print(f"Guardando usuario {username} en la base de datos...")
            query.save()
