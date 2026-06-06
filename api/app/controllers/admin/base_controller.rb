module Admin
  # Server-rendered backoffice base. Unlike the JSON API (ActionController::API),
  # these controllers render ERB views and use sessions/flash/CSRF, so the app
  # re-enables that middleware in application.rb. Gated by HTTP Basic auth with
  # env-configurable credentials (sensible local defaults).
  class BaseController < ActionController::Base
    layout "admin"
    protect_from_forgery with: :exception

    DEFAULT_PASSWORD = "!cromoswap!".freeze
    ADMIN_EMAIL = ENV.fetch("ADMIN_EMAIL", "admin@cromoswap.local")
    ADMIN_PASSWORD = ENV.fetch("ADMIN_PASSWORD", DEFAULT_PASSWORD)

    # Refuse to expose the backoffice in production with the public default
    # password — the panel can dump/delete every collector's data. Runs before
    # the auth challenge so the default credentials can't even be used.
    before_action :require_configured_admin
    http_basic_authenticate_with name: ADMIN_EMAIL, password: ADMIN_PASSWORD

    private

    def require_configured_admin
      return unless Rails.env.production?
      return if ENV["ADMIN_PASSWORD"].present? && ENV["ADMIN_PASSWORD"] != DEFAULT_PASSWORD

      render plain: "Admin backoffice is disabled until a non-default ADMIN_PASSWORD is configured.",
             status: :service_unavailable
    end
  end
end
