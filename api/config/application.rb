require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks middleware])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # The server-rendered /admin backoffice needs cookies/session/flash, CSRF,
    # and Rack::MethodOverride (so form button_to method: :delete/:patch works —
    # api_only strips it). The JSON API ignores these, so they are inert there.
    config.middleware.use Rack::MethodOverride
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: "_cromoswap_admin"
    config.middleware.use ActionDispatch::Flash

    # api_only strips the CSP middleware; the app serves HTML (SPA + admin), so
    # add it back, above Static so the header also reaches documents served
    # straight from public/. The policy lives in
    # config/initializers/content_security_policy.rb. SecurityHeaders adds
    # Permissions-Policy and Referrer-Policy the same way (Rails' own
    # PermissionsPolicy middleware still emits the deprecated Feature-Policy
    # header, so it is not used).
    require_relative "../lib/middleware/security_headers"
    config.middleware.insert_before ActionDispatch::Static, ActionDispatch::ContentSecurityPolicy::Middleware
    config.middleware.insert_before ActionDispatch::Static, SecurityHeaders
  end
end
