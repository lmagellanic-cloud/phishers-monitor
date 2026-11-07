import pathlib

from django.core.management.base import BaseCommand
from django_core.settings import MEDIA_ROOT

from phishers.models import MonitoredUser

WORKING_DIR = pathlib.Path(__file__).parent


class Command(BaseCommand):
    help = "Empty phishers database"

    def handle(self, *args, **options):
        query = MonitoredUser.objects.all()
        for monitored_user in query:
            # Eliminando fichero JSON
            monitored_user_json = MEDIA_ROOT.joinpath(f"{monitored_user.user_data}")
            print(f"Eliminando archivo {monitored_user_json}...")
            monitored_user_json.unlink()

            # Eliminando usuario de la base de datos
            print(f"Eliminando usuario {monitored_user.username}")
            monitored_user.delete()
