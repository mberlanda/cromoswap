module Api
  module V1
    class LeaderboardController < BaseController
      TOTAL_STICKERS = 980

      # GET /api/v1/leaderboard
      def index
        rows = AlbumSticker
          .group(:user_name)
          .select("user_name, COUNT(*) AS owned_count")
          .order("owned_count DESC")

        entries = rows.map do |row|
          owned = row.owned_count.to_i
          {
            userName: row.user_name,
            owned: owned,
            missing: TOTAL_STICKERS - owned,
          }
        end

        render json: entries
      end
    end
  end
end
