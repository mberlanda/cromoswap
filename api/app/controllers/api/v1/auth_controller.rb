module Api
  module V1
    # Account endpoints. register/login are public; me/password require a token.
    class AuthController < BaseController
      include Authenticated

      skip_before_action :authenticate_user!, only: %i[register login]

      # POST /api/v1/auth/register
      # Creates a user + its 1:1 session (user_name defaults to the username) and
      # returns a token. 422 on duplicate/invalid username or weak password.
      def register
        user = User.new(username: params[:username], password: params[:password])
        return render_errors(user) unless user.save

        session = Session.create!(user_name: user.username, user: user)
        render json: auth_payload(user, session), status: :created
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(username: params[:username].to_s.downcase)
        if user&.authenticate(params[:password])
          render json: auth_payload(user, user.session)
        else
          render json: { error: "invalid credentials" }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_json(current_user), session: session_or_nil(current_session) }
      end

      # POST /api/v1/auth/password — change own password.
      def password
        unless current_user.authenticate(params[:currentPassword])
          return render json: { errors: [ "current password is incorrect" ] }, status: :unprocessable_content
        end

        current_user.password = params[:newPassword]
        return render_errors(current_user) unless current_user.save

        head :ok
      end

      private

      def auth_payload(user, session)
        {
          token: JsonWebToken.encode(user_id: user.id),
          user: user_json(user),
          session: session_or_nil(session)
        }
      end

      # Lightweight (no scan list) so auth calls don't load every scan. `session`
      # can legitimately be null for a user with no session yet — e.g. a
      # backoffice-created user not yet connected to a collector (Phase 7).
      def session_or_nil(session)
        session && session_summary_json(session)
      end

      def render_errors(record)
        render json: { errors: record.errors.full_messages }, status: :unprocessable_content
      end
    end
  end
end
