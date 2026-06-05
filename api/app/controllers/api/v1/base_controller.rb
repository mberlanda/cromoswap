module Api
  module V1
    class BaseController < ActionController::API
      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "not found" }, status: :not_found
      end

      private

      def session_json(session)
        {
          id: session.id,
          userName: session.user_name,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          scans: session.scans.map { |scan| scan_json(scan) }
        }
      end

      def scan_json(scan)
        {
          id: scan.id,
          sessionId: scan.session_id,
          normalizedCode: scan.normalized_code,
          source: scan.source,
          confidence: scan.confidence,
          capturedAt: scan.captured_at,
          createdAt: scan.created_at,
          updatedAt: scan.updated_at
        }
      end

      def sticker_json(sticker)
        {
          id: sticker.id,
          userName: sticker.user_name,
          normalizedCode: sticker.normalized_code,
          ownedAt: sticker.owned_at
        }
      end
    end
  end
end
