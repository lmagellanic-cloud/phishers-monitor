from django.contrib.auth.models import Group, User
from rest_framework import serializers

from phishers.models import (
    Canal,
    MonitoredUser,
    MonitoredUserDetails,
    Timestamp,
    Todo,
    UserDetails,
    UserReadBooks,
    Video,
    VideoCheckpoint,
)


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ["url", "username", "email", "groups"]


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ["url", "name"]


class MonitoredUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredUser
        fields = ["username", "user_data"]


class MonitoredUserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredUserDetails
        fields = [
            "id",
            "monitored_user",
            "name",
            "surname",
            "surname_2",
            "phone",
            "is_phished",
        ]


class UserDetailsSerializer(serializers.ModelSerializer):
    username = serializers.SlugRelatedField(
        queryset=User.objects.all(),
        slug_field="username",
    )

    class Meta:
        model = UserDetails
        fields = "__all__"


class UserReadBooksSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReadBooks
        fields = "__all__"


class TimestampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timestamp
        fields = "__all__"


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = "__all__"


class CanalSerializer(serializers.ModelSerializer):
    canal_id = serializers.CharField(max_length=200)

    class Meta:
        model = Canal
        fields = "__all__"


class VideoSerializer(serializers.ModelSerializer):
    video_id = serializers.CharField(max_length=30)

    class Meta:
        model = Video
        fields = "__all__"


class VideoCheckpointSerializer(serializers.ModelSerializer):
    video = serializers.PrimaryKeyRelatedField(queryset=Video.objects.all())

    class Meta:
        model = VideoCheckpoint
        fields = "__all__"
