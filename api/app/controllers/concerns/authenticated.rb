# Bearer-JWT authentication for write/account endpoints.
#
# Parses `Authorization: Bearer <token>`, verifies it, and exposes
# `current_user` (and its `current_session`). Any missing/invalid/expired token
# is a 401 — the acting identity always comes from the token, never the client
# body, which is what keeps cross-user writes out (see Phase 4).
module Authenticated
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    render(json: { error: "unauthorized" }, status: :unauthorized) unless current_user
  end

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = begin
      payload = JsonWebToken.decode(bearer_token)
      User.find_by(id: payload["user_id"]) if payload
    end
  end

  def current_session
    current_user&.session
  end

  def bearer_token
    request.authorization.to_s.remove(/\ABearer /)
  end
end
