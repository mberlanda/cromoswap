module Api
  module V1
    class ScansController < BaseController
      include Authenticated

      # index is a public read (board/album browsing); writes require a token.
      skip_before_action :authenticate_user!, only: :index

      # GET /api/v1/sessions/:session_id/scans
      def index
        session = Session.find(params[:session_id])
        render json: session.scans.order(:captured_at).map { |s| scan_json(s) }
      end

      # POST /api/v1/scans — always lands in the token user's own session.
      def create
        return render_forbidden unless current_session
        return render_forbidden if params[:sessionId].present? && params[:sessionId] != current_session.id

        scan = current_session.scans.create!(
          normalized_code: params[:normalizedCode],
          source: params.fetch(:source, "ocr"),
          confidence: params[:confidence],
          captured_at: params[:capturedAt],
        )
        render json: scan_json(scan), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      # Scoped finder: another user's scan id is a 404, never updated/destroyed.
      def update
        scan = current_session_scans.find(params[:id])
        if scan.update(normalized_code: params[:normalizedCode])
          render json: scan_json(scan)
        else
          render json: { errors: scan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        current_session_scans.find(params[:id]).destroy!
        head :no_content
      end

      private

      def current_session_scans
        return Scan.none unless current_session

        current_session.scans
      end
    end
  end
end
