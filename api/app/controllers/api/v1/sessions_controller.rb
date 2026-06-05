module Api
  module V1
    class SessionsController < BaseController
      # GET /api/v1/sessions?ids[]=id1&ids[]=id2
      # Returns lightweight session summaries (no full scan list) for the home screen.
      def index
        ids = Array(params[:ids])
        return render json: [] if ids.empty?

        sessions = Session.where(id: ids).order(created_at: :desc)
        render json: sessions.map { |s| session_summary_json(s) }
      end

      # POST /api/v1/sessions
      # Creates or upserts a session. Accepts an optional client-provided UUID;
      # when omitted the server generates one. Scans in the body are processed
      # for legacy batch-sync compatibility.
      def create
        session_params = params.require(:session)

        session = if session_params[:id].present?
          Session.find_or_initialize_by(id: session_params[:id])
        else
          Session.new
        end
        session.user_name = session_params[:userName]
        session.save!

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

      private

      def session_summary_json(session)
        {
          id: session.id,
          userName: session.user_name,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          scanCount: session.scans.count,
        }
      end
    end
  end
end
