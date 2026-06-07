# Encodes/decodes HS256 JSON Web Tokens for cloud authentication.
#
# The signing secret is a dedicated `JWT_SECRET` when set, otherwise the app's
# `secret_key_base`. Tokens carry `user_id` and a default 30-day `exp`; there are
# no refresh tokens (re-login on expiry). `decode` returns nil for any invalid,
# tampered, or expired token so callers can treat "no identity" uniformly.
class JsonWebToken
  ALGORITHM = "HS256".freeze
  DEFAULT_EXPIRY = 30.days

  class << self
    def encode(payload, exp = DEFAULT_EXPIRY.from_now)
      JWT.encode(payload.merge(exp: exp.to_i), secret, ALGORITHM)
    end

    def decode(token)
      JWT.decode(token, secret, true, algorithm: ALGORITHM).first
    rescue JWT::DecodeError
      nil
    end

    private

    def secret
      ENV["JWT_SECRET"].presence || Rails.application.secret_key_base
    end
  end
end
