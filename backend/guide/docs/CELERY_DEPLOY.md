# دیپلوی Celery Worker برای Guide Reindex

## Health Check (Kubernetes)

Celery worker یک HTTP server روی پورت **8080** اجرا می‌کند:

| آدرس | پورت پیش‌فرض |
|------|--------------|
| `http://localhost:8080/health` | 8080 |

برای تغییر پورت: `CELERY_HEALTH_PORT=9999`

### نمونه Pod در Kubernetes

```yaml
containers:
  - name: celery
    image: tokan-celery:latest
    ports:
      - containerPort: 8080
        name: health
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```

---

## پیش‌نیاز
- Redis (یا هر broker سازگار با Celery) در دسترس باشد
- `CELERY_BROKER_URL` و `CELERY_RESULT_BACKEND` در env ست شده باشند

## Build و اجرا با Dockerfile.celery

```bash
# Build
docker build -f Dockerfile.celery -t tokan-celery .

# Run (همه envها مثل backend اصلی باید پاس بشن)
docker run --env-file .env \
  -e CELERY_BROKER_URL=redis://redis:6379/1 \
  -e CELERY_RESULT_BACKEND=redis://redis:6379/2 \
  -e CHROMA_MODE=persistent \
  -e CHROMA_PERSIST_PATH=/app/chroma_data \
  -e EMBEDDING_PROVIDER=openai \
  -e EMBEDDING_MODEL=text-embedding-3-small \
  -e OPENAI_API_KEY=... \
  -v ./chroma_data:/app/chroma_data \
  tokan-celery
```

## نمونه docker-compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    # ...

  celery:
    build:
      context: .
      dockerfile: Dockerfile.celery
    env_file: .env
    depends_on:
      - redis
      - backend  # برای DB
    volumes:
      - chroma_data:/app/chroma_data  # برای CHROMA_MODE=persistent
    command: celery -A core worker -l info
```

## اجرای محلی (بدون Docker)

```bash
# Redis باید در حال اجرا باشه
export CELERY_BROKER_URL=redis://localhost:6379/1
export CELERY_RESULT_BACKEND=redis://localhost:6379/2

celery -A core worker -l info
```
