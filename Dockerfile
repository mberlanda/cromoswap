# Single image: build the web bundle, then serve it as static assets from the
# Rails app so the front end and API share one origin.

# 1. Build the Vite front end.
FROM node:22-alpine AS web-build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# 2. Rails app that serves the bundle from public/ and exposes the API.
FROM ruby:3.3.6-slim AS app
# postgresql-client-18 provides pg_dump for the admin backoffice SQL export.
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && install -d /usr/share/postgresql-common/pgdg \
  && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  && . /etc/os-release \
  && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update -qq \
  && apt-get install -y --no-install-recommends build-essential libpq-dev postgresql-client-18 git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/Gemfile api/Gemfile.lock ./
RUN bundle config set build.pg --with-pg-config=$(which pg_config) \
  && bundle install

COPY api/ ./
COPY --from=web-build /web/dist ./public

ENV RAILS_ENV=development
EXPOSE 3000
CMD ["bash", "-c", "bundle exec rails db:prepare && bundle exec rails server -b 0.0.0.0 -p 3000"]
