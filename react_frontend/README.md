# Phishers Monitor Frontend

This React Router app shows the paginated monitored-user list from Django REST.

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

Then start the frontend with `npm run dev` and open `http://localhost:3000`. The page loads `/phishers/monitored_users/` in its server-side route loader, so the browser does not call Django directly. Set `DJANGO_API_TARGET` if Django runs at a different address; it defaults to `http://localhost:8080`.

## Validation

```sh
npm run typecheck
npm run build
```
