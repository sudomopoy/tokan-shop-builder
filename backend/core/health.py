"""
Health check endpoints - بدون وابستگی به store خاصی.
"""
from django.http import JsonResponse


def live_check(request):
    """ساده‌ترین چک: فقط تأیید که سرویس در حال اجرا است. بدون DB یا store."""
    return JsonResponse({"status": "ok", "service": "tokan-shop-builder"}, status=200)


def health_check(request):
    """چک کامل: شامل اتصال به دیتابیس. بدون وابستگی به store."""
    try:
        from django.db import connection

        connection.cursor()

        return JsonResponse(
            {"status": "ok", "service": "tokan-shop-builder", "database": "connected"},
            status=200,
        )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "service": "tokan-shop-builder", "error": str(e)},
            status=503,
        )