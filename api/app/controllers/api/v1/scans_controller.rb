module Api
  module V1
    class ScansController < BaseController
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
