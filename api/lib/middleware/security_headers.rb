# Adds the security headers that Rails' own middleware can't cover here:
#
#   * Permissions-Policy — Rails 8.1 still emits the deprecated
#     `Feature-Policy` header (old syntax), which current browsers ignore.
#   * Referrer-Policy — `action_dispatch.default_headers` only reaches
#     controller responses, but the SPA document is usually served straight
#     from public/ by ActionDispatch::Static.
#
# Inserted above Static (see config/application.rb) so every response gets
# them. Existing headers are never overwritten.
class SecurityHeaders
  HEADERS = {
    # Everything off except the camera, which the sticker scanner needs.
    "permissions-policy" => "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
    "referrer-policy" => "strict-origin-when-cross-origin"
  }.freeze

  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, body = @app.call(env)
    HEADERS.each { |name, value| headers[name] = value unless headers[name] }
    [ status, headers, body ]
  end
end
