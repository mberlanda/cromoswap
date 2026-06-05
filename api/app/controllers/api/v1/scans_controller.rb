module Api
  module V1
    class ScansController < BaseController
      # GET /api/v1/sessions/:session_id/scans
      def index
        session = Session.find(params[:session_id])
        render json: session.scans.order(:captured_at).map { |s| scan_json(s) }
      end

      # POST /api/v1/scans
      def create
        session = Session.find(params[:sessionId])
        scan = session.scans.create!(
          normalized_code: params[:normalizedCode],
          source: params.fetch(:source, "ocr"),
          confidence: params[:confidence],
          captured_at: params[:capturedAt],
        )
        render json: scan_json(scan), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def update
        scan = Scan.find(params[:id])
        if scan.update(normalized_code: params[:normalizedCode])
          render json: scan_json(scan)
        else
          render json: { errors: scan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        Scan.find(params[:id]).destroy!
        head :no_content
      end
    end
  end
end
