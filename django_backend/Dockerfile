FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /django_backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY django_backend/ ./
RUN SECRET_KEY=collectstatic-build-key python manage.py collectstatic --noinput
RUN mkdir -p /data /django_backend/media \
    && groupadd --system django_backend \
    && useradd --system --gid django_backend django_backend \
    && chown -R django_backend:django_backend /data /django_backend/media

USER django_backend

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn django_core.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-2} --access-logfile -"]