from django.db import models


class MonitoredUser(models.Model):
    username = models.CharField(primary_key=True, max_length=255)
    user_data = models.FileField(upload_to="monitored_user")


class MonitoredUserDetails(models.Model):
    monitored_user = models.ForeignKey(
        MonitoredUser, on_delete=models.CASCADE, related_name="details"
    )
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    surname_2 = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20)
    is_phished = models.BooleanField()
