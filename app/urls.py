from django.urls import path
from . import views


urlpatterns = [
	path('', views.dashboard_view, name='dashboard'),   # your HTML entry point
	path('register/', views.register_view, name='register'),
	path('logout/', views.logout_view, name='logout_view'),
]