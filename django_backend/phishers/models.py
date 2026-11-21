import datetime

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


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


class UserDetails(models.Model):
    username = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    surname_2 = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20)
    is_monitored = models.BooleanField()


class UserReadBooks(models.Model):
    id = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)
    descripcion = models.TextField()


class Timestamp(models.Model):
    id = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    timestamp = models.DateTimeField(default=timezone.now)


class Todo(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField()
    completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Canal(models.Model):
    canal_id = models.CharField(primary_key=True, max_length=200)
    canal_url = models.URLField(null=True)
    prioridad = models.IntegerField(default=99)
    ignorar = models.BooleanField(default=False)
    updated_at = models.DateTimeField(
        auto_now=False, auto_now_add=False, default=datetime.datetime(2000, 1, 1)
    )


class Video(models.Model):
    video_id = models.CharField(primary_key=True, max_length=30)
    canal = models.ForeignKey(Canal, null=True, on_delete=models.CASCADE)
    video_visto = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True, null=True)


class VideoCheckpoint(models.Model):
    video = models.OneToOneField(Video, on_delete=models.CASCADE, primary_key=True)
    start = models.IntegerField(default=0)
    titulo = models.CharField(max_length=200, null=True, blank=True)
