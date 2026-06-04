# Be sure to restart your server when you modify this file.
#
# Cross-Origin Resource Sharing for the API, so the web app can sync from a
# separate origin (e.g. a Vite dev server, or a separately-hosted front end).
# Allowed origins come from CORS_ORIGINS (comma-separated); localhost dev ports
# are allowed by default. When the bundle is served by Rails (same origin),
# CORS is not needed.
#
# Read more: https://github.com/cyu/rack-cors

allowed_origins = ENV.fetch("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map(&:strip)
  .reject(&:empty?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/*",
      headers: :any,
      methods: %i[get post patch delete options]
  end
end
