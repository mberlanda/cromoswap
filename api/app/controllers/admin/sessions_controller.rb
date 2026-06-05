module Admin
  class SessionsController < BaseController
    before_action :set_session, only: %i[show edit update destroy]

    def index
      @sessions = Session.order(created_at: :desc)
    end

    def show; end

    def new
      @session = Session.new
    end

    def create
      @session = Session.new(session_params)
      if @session.save
        redirect_to admin_session_path(@session), notice: "Session created."
      else
        render :new, status: :unprocessable_content
      end
    end

    def edit; end

    def update
      if @session.update(session_params)
        redirect_to admin_session_path(@session), notice: "Session updated."
      else
        render :edit, status: :unprocessable_content
      end
    end

    def destroy
      @session.destroy
      redirect_to admin_sessions_path, notice: "Session deleted."
    end

    private

    def set_session
      @session = Session.find(params[:id])
    end

    def session_params
      params.require(:session).permit(:user_name)
    end
  end
end
