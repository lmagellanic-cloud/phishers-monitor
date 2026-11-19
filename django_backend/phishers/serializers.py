from django.contrib.auth.models import Group, User
from rest_framework import serializers

from phishers.models import MonitoredUser, MonitoredUserDetails


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
