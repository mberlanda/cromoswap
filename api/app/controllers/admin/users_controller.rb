module Admin
  class UsersController < BaseController
    before_action :set_user, only: %i[show destroy reset_password connect disconnect]

    def index
      @users = User.includes(:session).order(:username)
    end

    def show
      load_unlinked_sessions
    end

    def new
      @user = User.new
    end

    # Creates a user and its 1:1 session (user_name = username), mirroring cloud
    # registration so a backoffice-created account is immediately usable.
    def create
      @user = User.new(user_params)
      unless @user.valid?
        return render :new, status: :unprocessable_content
      end

      # Atomic: a user must never persist without its required 1:1 session.
      ActiveRecord::Base.transaction do
        @user.save!
        Session.create!(user_name: @user.username, user: @user)
      end
      redirect_to admin_user_path(@user), notice: "User #{@user.username} created."
    end

    def destroy
      @user.destroy
      redirect_to admin_users_path, notice: "User #{@user.username} deleted."
    end

    def reset_password
      if @user.update(password: params.require(:user).permit(:password)[:password])
        redirect_to admin_user_path(@user), notice: "Password reset for #{@user.username}."
      else
        load_unlinked_sessions
        render :show, status: :unprocessable_content
      end
    end

    # Link the user to an existing collector session (backfill). Enforces 1:1 on
    # both sides: the session must be free and the user must not already own one.
    def connect
      if params[:user_name].blank?
        return redirect_to admin_user_path(@user), alert: "Enter a collector name to connect."
      end

      session = Session.find_by(user_name: params[:user_name])
      if session.nil?
        redirect_to admin_user_path(@user), alert: "No collector named #{params[:user_name]}."
      elsif session.user_id.present?
        redirect_to admin_user_path(@user), alert: "That collector is already linked to a user."
      elsif @user.session.present?
        redirect_to admin_user_path(@user), alert: "#{@user.username} is already linked to a collector."
      else
        session.update!(user: @user)
        redirect_to admin_user_path(@user), notice: "Linked #{@user.username} to #{session.user_name}."
      end
    end

    def disconnect
      @user.session&.update!(user_id: nil)
      redirect_to admin_user_path(@user), notice: "Unlinked #{@user.username}."
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    # Sessions available to connect: not yet linked to any user.
    def load_unlinked_sessions
      @unlinked_sessions = Session.where(user_id: nil).order(:user_name)
    end

    def user_params
      params.require(:user).permit(:username, :password)
    end
  end
end
