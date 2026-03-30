from rest_framework.permissions import BasePermission
from .models import UserRole


class IsBursar(BasePermission):
    """
    Allow access only to users with BURSAR role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'BURSAR'
        except UserRole.DoesNotExist:
            return False


class IsHeadmaster(BasePermission):
    """
    Allow access only to users with HEADMASTER role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'HEADMASTER'
        except UserRole.DoesNotExist:
            return False


class IsAccountant(BasePermission):
    """
    Allow access only to users with ACCOUNTANT role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'ACCOUNTANT'
        except UserRole.DoesNotExist:
            return False


class IsTeacher(BasePermission):
    """
    Allow access only to users with TEACHER role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'TEACHER'
        except UserRole.DoesNotExist:
            return False


class IsParent(BasePermission):
    """
    Allow access only to users with PARENT role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'PARENT'
        except UserRole.DoesNotExist:
            return False


class IsStudent(BasePermission):
    """
    Allow access only to users with STUDENT role.
    """
    def has_permission(self, request, view):
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'STUDENT'
        except UserRole.DoesNotExist:
            return False


class BursarOrReadOnly(BasePermission):
    """
    Allow BURSAR full access, others read-only.
    """
    def has_permission(self, request, view):
        if request.method == 'GET':
            return True
        # Write access only for bursar
        try:
            user_role = UserRole.objects.get(user=request.user)
            return user_role.role == 'BURSAR'
        except UserRole.DoesNotExist:
            return False
