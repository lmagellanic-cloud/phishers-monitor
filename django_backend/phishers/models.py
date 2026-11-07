from django.db import models


class MonitoredUser(models.Model):
    username = models.CharField(primary_key=True, max_length=255)
    user_data = models.FileField(upload_to="monitored_user")
