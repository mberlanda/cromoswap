module Admin
  # Server-rendered backoffice base. Unlike the JSON API (ActionController::API),
  # these controllers render ERB views and use sessions/flash/CSRF, so the app
  # re-enables that middleware in application.rb. Gated by HTTP Basic auth with
  # env-configurable credentials (sensible local defaults).
  class BaseController < ActionController::Base
    layout "admin"
    protect_from_forgery with: :exception

    ADMIN_EMAIL = ENV.fetch("ADMIN_EMAIL", "admin@cromoswap.local")
    ADMIN_PASSWORD = ENV.fetch("ADMIN_PASSWORD", "!cromoswap!")

    http_basic_authenticate_with name: ADMIN_EMAIL, password: ADMIN_PASSWORD
  end
end
