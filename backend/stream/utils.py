"""
امن‌سازی لینک استریم با Django signing.
توکن شامل: product_id, order_item_id, store_user_id, store_id
"""
from django.core.signing import dumps, loads, BadSignature

TOKEN_MAX_AGE = 60 * 120  # 2 hours in seconds


def create_stream_token(product_id: str, order_item_id: str, store_user_id: str, store_id: str) -> str:
    """توکن امضا‌شده برای دسترسی امن به استریم."""
    payload = {
        "product_id": str(product_id),
        "order_item_id": str(order_item_id),
        "store_user_id": str(store_user_id),
        "store_id": str(store_id),
    }
    return dumps(payload, salt="stream-access")


def verify_stream_token(token: str) -> dict | None:
    """
    بررسی و بازگرداندن payload توکن.
    None در صورت نامعتبر بودن.
    """
    try:
        return loads(token, salt="stream-access")
    except BadSignature:
        return None
