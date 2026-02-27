from django_redis import get_redis_connection

def track_page_view(articleid):
    conn = get_redis_connection("default")
    conn.incr(f'views:product:{articleid}')