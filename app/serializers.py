from rest_framework import serializers
from .models import Transaction, Category


class CategorySerializer(serializers.ModelSerializer):
	class Meta:
		model = Category
		fields = ['id', 'name', 'color', 'type']


class TransactionSerializer(serializers.ModelSerializer):
	category_id = serializers.PrimaryKeyRelatedField(
		source='category',
		queryset=Category.objects.all(),
		required=False,
		allow_null=True
	)
	category = CategorySerializer(read_only=True)  # nested category data

	class Meta:
		model = Transaction
		fields = ['id', 'description', 'amount', 'is_income', 'date', 'category_id', 'category']