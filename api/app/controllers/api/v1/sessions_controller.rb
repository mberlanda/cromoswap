module Api
  module V1
    class SessionsController < BaseController
      include Authenticated

      # index/show are public reads (home screen, board); create requires a token
      # and upserts into the token user's own session.
      skip_before_action :authenticate_user!, only: %i[index show]

      # GET /api/v1/sessions?ids[]=id1&ids[]=id2
      # Returns lightweight session summaries (no full scan list) for the home screen.
      def index
        ids = Array(params[:ids])
        return render json: [] if ids.empty?

        sessions = Session.where(id: ids).order(created_at: :desc)
        render json: sessions.map { |s| session_summary_json(s) }
      end

      # POST /api/v1/sessions
      # Upserts the token user's own session (1:1) and batch-syncs scans into it.
      # The client-supplied session id is ignored — the token is the authority —
      # so a client that still owns a local UUID adopts the server's session id.
      def create
        return render_forbidden unless current_session

        session = current_session
        display_name = params.dig(:session, :userName)
        session.update!(user_name: display_name) if display_name.present?

        Array(params[:scans]).each do |scan_params|
          scan = session.scans.find_or_initialize_by(id: scan_params[:id])
          scan.assign_attributes(
            normalized_code: scan_params[:normalizedCode],
            source: scan_params[:source],
            confidence: scan_params[:confidence],
            captured_at: scan_params[:capturedAt],
          )
          scan.save!
        end

        render json: session_json(session.reload), status: :created
      end

      def show
        session = Session.find(params[:id])
        render json: session_json(session)
      end
    end
  end
end
