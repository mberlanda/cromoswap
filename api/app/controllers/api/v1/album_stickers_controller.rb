module Api
  module V1
    class AlbumStickersController < BaseController
      include Authenticated

      VALID_CODE = /\A[A-Z]{3}\d{2}\z/

      # index is a public read (board view); toggle/sync require a token and act
      # only on the token user's own album.
      skip_before_action :authenticate_user!, only: :index

      # GET /api/v1/album_stickers?user_name=X
      def index
        user_name = params.require(:user_name)
        stickers = AlbumSticker.where(user_name: user_name).order(:normalized_code)
        render json: stickers.map { |s| sticker_json(s) }
      end

      # POST /api/v1/album_stickers/toggle
      # Adds the sticker if absent, removes it if present. Idempotent per direction.
      def toggle
        return render_forbidden unless own_album?
        user_name = album_user_name
        normalized_code = params.require(:normalizedCode)

        sticker = AlbumSticker.find_by(user_name: user_name, normalized_code: normalized_code)
        if sticker
          sticker.destroy!
          render json: { action: "removed", normalizedCode: normalized_code }
        else
          sticker = AlbumSticker.create!(
            user_name: user_name,
            normalized_code: normalized_code,
            owned_at: Time.current,
          )
          render json: { action: "added" }.merge(sticker_json(sticker)), status: :created
        end
      end

      # POST /api/v1/album_stickers/sync
      # Legacy batch-sync: replaces all owned codes for the token user atomically.
      def sync
        return render_forbidden unless own_album?
        user_name = album_user_name
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

      private

      # The album is keyed by the scan session's display name (e.g. "GiacomoPietro"),
      # not the lowercase account username. Fall back to the account username when
      # no session is linked yet.
      def album_user_name
        current_user.session&.user_name || current_user.username
      end

      # A client-supplied userName must match the album identity (or be omitted).
      def own_album?
        params[:userName].blank? || params[:userName] == album_user_name
      end
    end
  end
end
