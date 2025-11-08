from rest_framework import routers
from django.urls import path, include

from . import views_api
from .viewsets import TransactionViewSet, CategoryViewSet

router = routers.DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
	path('bootstrap/', views_api.bootstrap_view, name='bootstrap'),
	path('bootstrap/last-updates/', views_api.bootstrap_last_updates, name='bootstrap_last_updates'),
	path('bootstrap/transactions/', views_api.bootstrap_transactions, name='bootstrap_transactions'),
	path('bootstrap/categories/', views_api.bootstrap_categories, name='bootstrap_categories'),
	path('', include(router.urls)),
]
