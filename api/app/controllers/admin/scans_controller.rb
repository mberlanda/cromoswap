module Admin
  class ScansController < BaseController
    before_action :set_scan, only: %i[show edit update destroy]

    def index
      @scans = Scan.includes(:session).order(captured_at: :desc).limit(500)
    end

    def show; end

    def new
      @scan = Scan.new
    end

    def create
      @scan = Scan.new(scan_params)
      if @scan.save
        redirect_to admin_scan_path(@scan), notice: "Scan created."
      else
        render :new, status: :unprocessable_content
      end
    end

    def edit; end

    def update
      if @scan.update(scan_params)
        redirect_to admin_scan_path(@scan), notice: "Scan updated."
      else
        render :edit, status: :unprocessable_content
      end
    end

    def destroy
      @scan.destroy
      redirect_to admin_scans_path, notice: "Scan deleted."
    end

    private

    def set_scan
      @scan = Scan.find(params[:id])
    end

    def scan_params
      params.require(:scan).permit(:session_id, :normalized_code, :source, :confidence, :captured_at)
    end
  end
end
