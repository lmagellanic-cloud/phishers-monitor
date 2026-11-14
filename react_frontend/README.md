# Phishers Monitor Frontend

This React Router app shows paginated user lists from Django REST, including
monitored users and Django accounts.

The app requires signing in with a Django user account. Create one with
`python django_backend/manage.py createsuperuser` before logging in.

The app requires signing in with a Django user account. Create one with
`python django_backend/manage.py createsuperuser` before logging in.

## Development

Install dependencies and start the frontend:

```sh
npm install
npm run dev
```

Start Django from the repository root:

```sh
python django_backend/manage.py runserver 8080
```

Then start the frontend with `npm run dev` and open `http://localhost:3000`. The
server-side route loaders call Django under `/api/` (for example,
`/api/monitored_users/` and `/api/users/`), so the browser does not call Django
directly. Set `DJANGO_API_TARGET` if Django runs at a different address; it
defaults to `http://localhost:8080`.

The frontend stores the Django API token in a signed, HTTP-only session cookie.
Set `SESSION_SECRET` to a long random value when running the frontend in
production; the development server uses a local-only fallback.

The frontend stores the Django API token in a signed, HTTP-only session cookie.
Set `SESSION_SECRET` to a long random value when running the frontend in
production; the development server uses a local-only fallback.

## Validation

```sh
npm run typecheck
npm run build
```
