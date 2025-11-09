# admin.py
from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from django.utils.html import format_html
from django.contrib import messages
from .models import Transaction, Category
import random
from decimal import Decimal
from django.utils import timezone


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
	list_display = ('description', 'amount', 'is_income', 'category', 'date')
	list_filter = ('is_income', 'category', 'date')
	search_fields = ('description',)

	change_list_template = "admin/transactions_changelist.html"  # custom template

	def get_urls(self):
		urls = super().get_urls()
		custom_urls = [
			path('generate_50/', self.admin_site.admin_view(self.generate_50_transactions), name='generate_50_transactions'),
		]
		return custom_urls + urls

	def generate_50_transactions(self, request):
		user = request.user
		if not user.is_authenticated:
			self.message_user(request, "You must be logged in.", level=messages.ERROR)
			return redirect('..')

		# Get user's categories, fallback to any category if user has none
		user_categories = list(user.categories.all())
		if not user_categories:
			user_categories = list(Category.objects.all())

		for _ in range(50):
			category = random.choice(user_categories) if user_categories else None
			is_income = category.type == 'income' if category else random.choice([True, False])
			description = f"Sample transaction {_+1}"
			amount = Decimal(random.randint(100, 10000)) / 100  # random 1.00 - 100.00
			Transaction.objects.create(
				user=user,
				category=category,
				description=description,
				amount=amount,
				is_income=is_income,
				date=timezone.now()
			)

		self.message_user(request, "50 sample transactions created for you.")
		return redirect('..')
