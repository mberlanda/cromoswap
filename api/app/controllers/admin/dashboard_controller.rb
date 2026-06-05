module Admin
  class DashboardController < BaseController
    def index
      @counts = {
        collectors: AlbumSticker.distinct.count(:user_name),
        sessions: Session.count,
        scans: Scan.count,
        album_stickers: AlbumSticker.count
      }
    end
  end
end
