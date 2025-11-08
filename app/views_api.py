from django.utils.dateparse import parse_datetime
from django.db.models import Q, Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bootstrap_view(request):
    user = request.user

    # --- Parse query params for delta fetch ---
    last_tx_update = request.GET.get('last_transaction_update')
    last_cat_update = request.GET.get('last_category_update')

    last_tx_dt = parse_datetime(last_tx_update) if last_tx_update else None
    last_cat_dt = parse_datetime(last_cat_update) if last_cat_update else None

    # --- Transactions ---
    transactions_qs = Transaction.objects.filter(user=user)
    if last_tx_dt:
        transactions_qs = transactions_qs.filter(updated_at__gt=last_tx_dt)
    transactions_qs = transactions_qs.order_by('-date')

    # --- Categories ---
    categories_qs = Category.objects.filter(Q(user=user) | Q(predefined=True))
    if last_cat_dt:
        categories_qs = categories_qs.filter(updated_at__gt=last_cat_dt)

    # --- Latest timestamps ---
    last_transaction_update = Transaction.objects.filter(user=user).aggregate(
        latest=Max('updated_at')
    )['latest']

    last_category_update = Category.objects.filter(Q(user=user) | Q(predefined=True)).aggregate(
        latest=Max('updated_at')
    )['latest']

    return Response({
        'transactions': TransactionSerializer(transactions_qs, many=True).data,
        'categories': CategorySerializer(categories_qs, many=True).data,
        'last_transaction_update': last_transaction_update.isoformat() if last_transaction_update else None,
        'last_category_update': last_category_update.isoformat() if last_category_update else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bootstrap_last_updates(request):
	user = request.user
	last_tx = Transaction.objects.filter(user=user).aggregate(latest=Max('updated_at'))['latest']
	last_cat = Category.objects.filter(Q(user=user) | Q(predefined=True)).aggregate(latest=Max('updated_at'))['latest']
	return Response({
		'last_transaction_update': last_tx.isoformat() if last_tx else None,
		'last_category_update': last_cat.isoformat() if last_cat else None
	})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bootstrap_transactions(request):
	user = request.user
	since = request.query_params.get('since')
	qs = Transaction.objects.filter(user=user)
	if since:
		qs = qs.filter(updated_at__gt=since)
	last_update = qs.aggregate(latest=Max('updated_at'))['latest']
	return Response({
		'transactions': TransactionSerializer(qs, many=True).data,
		'last_transaction_update': last_update.isoformat() if last_update else None
	})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bootstrap_categories(request):
	user = request.user
	since = request.query_params.get('since')
	qs = Category.objects.filter(Q(user=user) | Q(predefined=True))
	if since:
		qs = qs.filter(updated_at__gt=since)
	last_update = qs.aggregate(latest=Max('updated_at'))['latest']
	return Response({
		'categories': CategorySerializer(qs, many=True).data,
		'last_category_update': last_update.isoformat() if last_update else None
	})
