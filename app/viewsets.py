from rest_framework import viewsets, permissions
from django.db import models
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
	serializer_class = TransactionSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Transaction.objects.filter(user=self.request.user).order_by('-date')

	def perform_create(self, serializer):
		category = None
		category_id = self.request.data.get('category_id')

		if category_id:
			# Can assign user-owned or predefined category (user=None)
			category = Category.objects.filter(
				pk=category_id
			).filter(
				models.Q(user=self.request.user) | models.Q(user__isnull=True)
			).first()

		serializer.save(user=self.request.user, category=category)


class CategoryViewSet(viewsets.ModelViewSet):
	serializer_class = CategorySerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Category.objects.filter(user=self.request.user)

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)
