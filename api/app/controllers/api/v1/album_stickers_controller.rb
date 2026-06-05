module Api
  module V1
    class AlbumStickersController < BaseController
      VALID_CODE = /\A[A-Z]{3}\d{2}\z/

      # Syncs the full set of owned sticker codes for a user.
      # POST /api/v1/album_stickers/sync
      def sync
        user_name = params.require(:userName)
        codes = Array(params[:codes])
                  .map(&:to_s)
                  .select { |c| c.match?(VALID_CODE) }
                  .uniq

        existing = AlbumSticker.where(user_name: user_name).pluck(:normalized_code)
        to_add = codes - existing
        to_remove = existing - codes

        ActiveRecord::Base.transaction do
          AlbumSticker.where(user_name: user_name, normalized_code: to_remove).delete_all
          to_add.each do |code|
            AlbumSticker.create!(user_name: user_name, normalized_code: code, owned_at: Time.current)
          end
        end

        render json: { ok: true, owned: codes.size }, status: :ok
      end
    end
  end
end
