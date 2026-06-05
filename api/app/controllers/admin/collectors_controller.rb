module Admin
  class CollectorsController < BaseController
    def index
      sticker_counts = AlbumSticker.group(:user_name).count
      session_counts = Session.group(:user_name).count
      scan_counts = Scan.joins(:session).group("sessions.user_name").count
      names = (sticker_counts.keys + session_counts.keys).uniq.sort
      @collectors = names.map do |name|
        {
          user_name: name,
          owned: sticker_counts[name] || 0,
          sessions: session_counts[name] || 0,
          scans: scan_counts[name] || 0
        }
      end
    end

    # Wipe everything for one collector: their sessions (scans cascade via
    # dependent: :destroy) and their album stickers.
    def destroy
      name = params[:user_name]
      ActiveRecord::Base.transaction do
        Session.where(user_name: name).destroy_all
        AlbumSticker.where(user_name: name).delete_all
      end
      redirect_to admin_collectors_path, notice: "Deleted collector #{name}."
    end
  end
end
