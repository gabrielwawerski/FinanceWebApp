from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import models
from django.shortcuts import render, redirect
import json

from rest_framework import viewsets, permissions

from app.forms import RegisterForm
from app.models import Transaction, Category
from app.serializers import TransactionSerializer, CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
	serializer_class = TransactionSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Transaction.objects.filter(user=self.request.user).order_by('-date')

	def perform_create(self, serializer):
		# Get category ID from request data (optional)
		category_id = self.request.data.get('category')
		category = None

		if category_id:
			try:
				# Only allow categories belonging to this user OR predefined
				category = Category.objects.get(
					id=category_id,
					user=self.request.user
				)
			except Category.DoesNotExist:
				# optionally check predefined categories
				try:
					category = Category.objects.get(id=category_id, predefined=True)
				except Category.DoesNotExist:
					category = None

		serializer.save(user=self.request.user, category=category)


class CategoryViewSet(viewsets.ModelViewSet):
	serializer_class = CategorySerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Category.objects.filter(user=self.request.user)

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)


@login_required
def dashboard_view(request):
	# Transactions
	transactions = Transaction.objects.filter(user=request.user).order_by('-date')
	transactions_list = [
		{
			"id": t.id,
			"description": t.description,
			"amount": float(t.amount),
			"is_income": t.is_income,
			"date": t.date.isoformat(),
			"category": {
        	    "id": t.category.id if t.category else None,
        	    "name": t.category.name if t.category else "Uncategorized",
        	    "color": t.category.color if t.category else "#bdc3c7",
        	}
		}
		for t in transactions
	]

	# Categories
	categories = Category.objects.filter(models.Q(user=request.user) | models.Q(predefined=True))
	categories_list = [
		{
			"id": c.id,
			"name": c.name,
			"color": getattr(c, "color", "#bdc3c7"),
			"type": c.type,  # income / expense
		}
		for c in categories
	]

	return render(
		request,
		'app/dashboard.html',
		{
			'transactions_json': json.dumps(transactions_list),
			'categories_json': json.dumps(categories_list)
		}
	)


def register_view(request):
	if request.method == "POST":
		form = RegisterForm(request.POST)
		if form.is_valid():
			user = form.save()
			login(request, user)  # automatically log them in
			return redirect("dashboard")  # go to your main dashboard
	else:
		form = RegisterForm()
	return render(request, "app/register.html", {"form": form})
