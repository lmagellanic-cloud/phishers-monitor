FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY django_backend/ ./
RUN SECRET_KEY=collectstatic-build-key python manage.py collectstatic --noinput
RUN mkdir -p /data /app/media \
    && groupadd --system app \
    && useradd --system --gid app app \
    && chown -R app:app /data /app/media

USER app

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn django_core.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-2} --access-logfile -"]