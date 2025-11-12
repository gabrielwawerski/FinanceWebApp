import random
from decimal import Decimal

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import path
from django.utils import timezone
from django.utils.html import format_html

from .models import Transaction, Category


# -----------------------------
# Inline Transactions under Category
# -----------------------------
class TransactionInline(admin.TabularInline):
	model = Transaction
	fields = ('description', 'amount', 'is_income', 'category', 'date')
	readonly_fields = ('date',)  # date cannot be edited
	extra = 0
	show_change_link = False
	ordering = ('-date',)

	def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
		# By default, allow all categories. Optional: limit to parent category if needed.
		return super().formfield_for_foreignkey(db_field, request, **kwargs)


# -----------------------------
# Category Admin
# -----------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'type', 'predefined', 'color_badge', 'user')
	list_filter = ('type', 'predefined')
	search_fields = ('name',)
	ordering = ('name',)
	raw_id_fields = ('user',)

	def color_badge(self, obj):
		return format_html(
			'<span style="display:inline-block;width:20px;height:20px;border-radius:50%;'
			'background-color:{};"></span>', obj.color
		)
	color_badge.short_description = 'Color'


# -----------------------------
# Transaction Admin
# -----------------------------
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
	list_display = ('id', 'description', 'amount', 'is_income', 'category', 'category_colored', 'date')
	list_display_links = ('id',)
	list_editable = ('description', 'amount', 'category')
	list_filter = ('is_income', 'category', 'date')
	readonly_fields = ('is_income',)
	search_fields = ('description', 'category__name')
	date_hierarchy = 'date'
	ordering = ('-date',)
	change_list_template = "admin/transactions_changelist.html"
	raw_id_fields = ('category', 'user')
	autocomplete_fields = ('category',)

	def category_colored(self, obj):
		if obj.category:
			return format_html(
				'<span style="display:inline-block;width:12px;height:12px;border-radius:50%;'
				'background-color:{};margin-right:5px;"></span>{}',
				obj.category.color, obj.category.name
			)

	category_colored.short_description = 'Category'
	category_colored.admin_order_field = 'category__name'


	def category_colored(self, obj):
		if obj.category:
			return format_html(
				'<span style="display:inline-block;width:12px;height:12px;border-radius:50%;'
				'background-color:{};margin-right:5px;"></span>{}',
				obj.category.color, obj.category.name
			)
		return '-'
	category_colored.short_description = 'Category'
	category_colored.admin_order_field = 'category__name'

	# -----------------------------
	# Custom URL for generating 50 sample transactions
	# -----------------------------
	def get_urls(self):
		urls = super().get_urls()
		custom_urls = [
			path(
				'generate_50/',
				self.admin_site.admin_view(self.generate_50_transactions),
				name='generate_50_transactions'
			),
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

		for i in range(50):
			category = random.choice(user_categories) if user_categories else None
			is_income = category.type == 'income' if category else random.choice([True, False])
			description = f"Sample transaction {i+1}"
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
