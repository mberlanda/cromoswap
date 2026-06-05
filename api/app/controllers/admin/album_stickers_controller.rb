module Admin
  class AlbumStickersController < BaseController
    before_action :set_album_sticker, only: %i[show edit update destroy]

    def index
      @album_stickers = AlbumSticker.order(:user_name, :normalized_code).limit(1000)
    end

    def show; end

    def new
      @album_sticker = AlbumSticker.new(owned_at: Time.current)
    end

    def create
      @album_sticker = AlbumSticker.new(album_sticker_params)
      if @album_sticker.save
        redirect_to admin_album_sticker_path(@album_sticker), notice: "Album sticker created."
      else
        render :new, status: :unprocessable_content
      end
    end

    def edit; end

    def update
      if @album_sticker.update(album_sticker_params)
        redirect_to admin_album_sticker_path(@album_sticker), notice: "Album sticker updated."
      else
        render :edit, status: :unprocessable_content
      end
    end

    def destroy
      @album_sticker.destroy
      redirect_to admin_album_stickers_path, notice: "Album sticker deleted."
    end

    private

    def set_album_sticker
      @album_sticker = AlbumSticker.find(params[:id])
    end

    def album_sticker_params
      params.require(:album_sticker).permit(:user_name, :normalized_code, :owned_at)
    end
  end
end
