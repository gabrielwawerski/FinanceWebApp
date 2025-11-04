from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet, dashboard_view, register_view


router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('categories', CategoryViewSet, basename='category')


urlpatterns = [
	path('', dashboard_view, name='dashboard'),   # your HTML entry point
	path('register/', register_view, name='register'),
	path('api/', include(router.urls)),            # REST endpoints
]