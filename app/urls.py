from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register('transactions', views.TransactionViewSet, basename='transaction')
router.register('categories', views.CategoryViewSet, basename='category')


urlpatterns = [
	path('', views.dashboard_view, name='dashboard'),   # your HTML entry point
	path('register/', views.register_view, name='register'),
	path('logout/', views.logout_view, name='logout_view'),
	path('api/', include(router.urls)),            # REST endpoints
]