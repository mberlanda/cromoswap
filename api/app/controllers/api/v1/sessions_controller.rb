module Api
  module V1
    class SessionsController < BaseController
      # Upserts a session and its scans (codes + metadata only). Client-generated
      # UUIDs make the sync idempotent. Image fields, if sent, are ignored.
      def create
        session_params = params.require(:session)
        session = Session.find_or_initialize_by(id: session_params[:id])
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
    end
  end
end
