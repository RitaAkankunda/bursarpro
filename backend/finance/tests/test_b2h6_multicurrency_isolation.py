from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase
from rest_framework import viewsets

from finance.phase8_viewsets import MultiCurrencyPaymentViewSet


class MultiCurrencyIsolationTests(SimpleTestCase):

    def setUp(self):
        self.queryset = MagicMock()
        self.queryset.none.return_value = "DENIED"
        self.queryset.filter.return_value = "SCOPED"

        self.base_patcher = patch.object(
            viewsets.ReadOnlyModelViewSet,
            "get_queryset",
            return_value=self.queryset,
        )
        self.base_patcher.start()
        self.addCleanup(self.base_patcher.stop)

    def view_for(self, user):
        view = MultiCurrencyPaymentViewSet()
        view.request = SimpleNamespace(user=user)
        return view

    def role_results(self, school_ids):
        roles = MagicMock()
        roles.values_list.return_value.distinct.return_value.__getitem__.return_value = school_ids
        return roles

    def test_unauthenticated_user_is_denied(self):
        user = SimpleNamespace(is_authenticated=False)

        with patch("finance.phase8_viewsets.UserRole.objects.filter") as roles:
            result = self.view_for(user).get_queryset()

        self.assertEqual(result, "DENIED")
        roles.assert_not_called()

    def test_user_without_school_is_denied(self):
        user = SimpleNamespace(is_authenticated=True)

        with patch(
            "finance.phase8_viewsets.UserRole.objects.filter",
            return_value=self.role_results([]),
        ):
            result = self.view_for(user).get_queryset()

        self.assertEqual(result, "DENIED")

    def test_multiple_school_assignments_are_denied(self):
        user = SimpleNamespace(is_authenticated=True)

        with patch(
            "finance.phase8_viewsets.UserRole.objects.filter",
            return_value=self.role_results([11, 22]),
        ):
            result = self.view_for(user).get_queryset()

        self.assertEqual(result, "DENIED")

    def test_single_school_filters_student_and_term(self):
        user = SimpleNamespace(is_authenticated=True)

        with patch(
            "finance.phase8_viewsets.UserRole.objects.filter",
            return_value=self.role_results([11]),
        ):
            result = self.view_for(user).get_queryset()

        self.assertEqual(result, "SCOPED")
        self.queryset.filter.assert_called_once_with(
            payment__student__school_id=11,
            payment__term__school_id=11,
        )
