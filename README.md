# Phishers Monitor

A web platform for visually analyzing user behavior in interactive systems using JSON files.

The application consists of a Django REST API and a React Router interface.

## Requirements

- Python 3.13 or a version compatible with `requirements.txt`.
- Node.js 24 for local frontend development.
- Docker Compose for the integrated deployment.

## Local Development

From the repository root, create a virtual environment and install the Django dependencies:

```sh
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

Set a local secret key and prepare the database:

```sh
export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(50))')"
python django_backend/manage.py migrate
python django_backend/manage.py createsuperuser
```

In the same terminal, start Django with development mode enabled so its static files are served:

```sh
DJANGO_DEBUG=true python django_backend/manage.py runserver 8080
```

In another terminal, install and start React Router:

```sh
cd react_frontend
npm ci
DJANGO_API_TARGET=http://localhost:8080 npm run dev
```

Open <http://localhost:3000> and sign in with the Django user created above. To generate sample data, run `python django_backend/manage.py populate_database` from the repository root.

## Docker Compose

The deployment runs Django, React Router, and Traefik. The application is available on port 80; the database and uploaded files persist in Docker volumes. Django static assets are collected during the image build and served by WhiteNoise.

```sh
cp .env.example .env
```

Edit `.env` and replace `DJANGO_SECRET_KEY` and `SESSION_SECRET` with independent random values. Then start the services:

```sh
docker compose up --build
```

Open <http://localhost>. To create a user account, run:

```sh
docker compose exec django python manage.py createsuperuser
```

Stop the services with `docker compose down`. To also delete the persistent database and uploaded files, run `docker compose down --volumes`.

## Useful Commands

Run `./django-shell` to open the interactive project CLI. It includes commands to list scripts, generate sample JSON, populate or empty the database, and open the Django shell. You can also run `python django_backend/manage.py <command>` directly.

In `react_frontend`, run `npm run typecheck` to check types and `npm run build` to create a production build.

## Project Structure

- `django_backend/`: Django configuration, API, migrations, management commands, and local `media/` storage.
- `react_frontend/`: React Router application, routes, styles, and Vite configuration.
- `docker-compose.yml`: Django, React Router, and Traefik services.
- `django-shell`: launcher for the interactive CLI.
- `requirements.txt` and `requirements-dev.txt`: Python dependencies.

## License

This project is distributed under the Apache License 2.0. See [LICENSE](LICENSE).
