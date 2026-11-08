FROM node:24-alpine AS development-dependencies-env
COPY . /react_frontend
WORKDIR /react_frontend
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /react_frontend/
WORKDIR /react_frontend
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
ARG APP_HOST=localhost
COPY . /react_frontend/
COPY --from=development-dependencies-env /react_frontend/node_modules /react_frontend/node_modules
WORKDIR /react_frontend
RUN APP_HOST="$APP_HOST" npm run build

FROM node:24-alpine
COPY ./package.json package-lock.json /react_frontend/
COPY --from=production-dependencies-env /react_frontend/node_modules /react_frontend/node_modules
COPY --from=build-env /react_frontend/build /react_frontend/build
WORKDIR /react_frontend
CMD ["npm", "run", "start"]
