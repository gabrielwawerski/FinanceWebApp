from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from datetime import date
import json

from rest_framework import viewsets, permissions

from app.forms import RegisterForm
from app.models import Transaction, Category
from app.serializers import TransactionSerializer, CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
	serializer_class = TransactionSerializer
	# permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Transaction.objects.filter(user=self.request.user).order_by('-date')

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
	serializer_class = CategorySerializer
	# permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Category.objects.filter(user=self.request.user)


@login_required
def dashboard_view(request):
	# Get all transactions for the logged-in user, ordered by newest first
	transactions = Transaction.objects.filter(user=request.user).order_by('-date')

	# Convert queryset to a list of dictionaries suitable for JSON
	transactions_list = [
		{
			"id": t.id,
			"description": t.description,
			"amount": float(t.amount),   # decimal → float for JS
			"is_income": t.is_income,
			"date": t.date.isoformat(),  # JS can parse ISO string
		}
		for t in transactions
	]

	# If no transactions, transactions_list will be an empty list: []
	return render(
		request,
		'app/dashboard.html',
		{'transactions_json': json.dumps(transactions_list)}
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
