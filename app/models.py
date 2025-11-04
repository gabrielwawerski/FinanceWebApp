from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
	name = models.CharField(max_length=100)

	def __str__(self):
		return self.name


class Transaction(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
	description = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=10, decimal_places=2)
	is_income = models.BooleanField(default=False)
	date = models.DateTimeField(auto_now_add=True)
