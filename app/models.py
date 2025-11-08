from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
	CATEGORY_TYPE_CHOICES = [
		('income', 'Income'),
		('expense', 'Expense'),
	]

	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories", null=True, blank=True)
	name = models.CharField(max_length=100)
	color = models.CharField(max_length=7, default="#3498db")  # store hex color
	predefined = models.BooleanField(default=False)  # True for default categories
	type = models.CharField(max_length=7, choices=CATEGORY_TYPE_CHOICES, default='expense')
	updated_at = models.DateTimeField(auto_now=True)  # <- track last update

	def __str__(self):
		return self.name


class Transaction(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
	description = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=10, decimal_places=2)
	is_income = models.BooleanField(default=False)
	date = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)  # <- track last update
