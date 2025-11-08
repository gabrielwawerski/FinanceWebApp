from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db import models
from django.shortcuts import render, redirect

from django.views.decorators.http import require_POST
from rest_framework.renderers import JSONRenderer

from app.forms import RegisterForm
from app.models import Transaction, Category
from app.serializers import TransactionSerializer, CategorySerializer


@login_required
def dashboard_view(request):
	# Fetch user transactions and categories
	transactions = Transaction.objects.filter(user=request.user).order_by('-date')
	categories = Category.objects.filter(models.Q(user=request.user) | models.Q(predefined=True))

	# Serialize them using DRF serializers
	transactions_json = JSONRenderer().render(TransactionSerializer(transactions, many=True).data)
	categories_json = JSONRenderer().render(CategorySerializer(categories, many=True).data)

	# Render HTML with serialized JSON (decoded to str for templates)
	return render(
		request,
		'app/dashboard.html',
		{
			'transactions_json': transactions_json.decode('utf-8'),
			'categories_json': categories_json.decode('utf-8')
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


@require_POST  # ensures only POST requests can trigger logout
def logout_view(request):
	logout(request)  # securely logs out the user
	return redirect('login')  # redirect after logout