require "rails_helper"

RSpec.describe "Admin::Users", type: :request do
  let!(:user) { User.create!(username: "mauro", password: "supersecret") }

  it "requires authentication" do
    get "/admin/users"
    expect(response).to have_http_status(:unauthorized)
  end

  it "lists users" do
    get "/admin/users", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("mauro")
  end

  it "shows a user" do
    get "/admin/users/#{user.id}", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("mauro")
  end

  describe "create" do
    it "creates a user and a 1:1 session" do
      expect {
        post "/admin/users", params: { user: { username: "luca", password: "supersecret" } }, headers: admin_auth
      }.to change(User, :count).by(1).and change(Session, :count).by(1)
      expect(response).to have_http_status(:found)
      created = User.find_by(username: "luca")
      expect(created.session.user_name).to eq("luca")
    end

    it "re-renders new on invalid input" do
      post "/admin/users", params: { user: { username: "BAD NAME", password: "x" } }, headers: admin_auth
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "reset_password" do
    it "sets a new password" do
      patch "/admin/users/#{user.id}/reset_password",
            params: { user: { password: "newpassword1" } }, headers: admin_auth
      expect(response).to have_http_status(:found)
      expect(user.reload.authenticate("newpassword1")).to be_truthy
    end

    it "rejects a too-short password" do
      patch "/admin/users/#{user.id}/reset_password",
            params: { user: { password: "short" } }, headers: admin_auth
      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.authenticate("supersecret")).to be_truthy
    end
  end

  describe "connect / disconnect" do
    let!(:collector) { Session.create!(user_name: "legacy") }

    # follow_redirect! drops the basic-auth header, so re-GET the target with it.
    def flash_after_redirect
      get response.headers["Location"], headers: admin_auth
      response.body
    end

    it "links the user to an existing collector session" do
      patch "/admin/users/#{user.id}/connect",
            params: { user_name: "legacy" }, headers: admin_auth
      expect(response).to have_http_status(:found)
      expect(collector.reload.user_id).to eq(user.id)
    end

    it "refuses to connect when the session is already linked to another user" do
      other = User.create!(username: "other", password: "supersecret")
      collector.update!(user: other)
      patch "/admin/users/#{user.id}/connect",
            params: { user_name: "legacy" }, headers: admin_auth
      expect(response).to have_http_status(:found)
      expect(flash_after_redirect).to include("already")
      expect(collector.reload.user_id).to eq(other.id)
    end

    it "refuses to connect when the user already has a session" do
      Session.create!(user_name: "mauro", user: user)
      patch "/admin/users/#{user.id}/connect",
            params: { user_name: "legacy" }, headers: admin_auth
      expect(flash_after_redirect).to include("already")
      expect(collector.reload.user_id).to be_nil
    end

    it "reports when connecting to an unknown collector" do
      patch "/admin/users/#{user.id}/connect",
            params: { user_name: "ghost" }, headers: admin_auth
      expect(flash_after_redirect).to include("No collector")
    end

    it "rejects a blank collector name without a DB lookup" do
      patch "/admin/users/#{user.id}/connect",
            params: { user_name: "" }, headers: admin_auth
      expect(flash_after_redirect).to include("Enter a collector name")
    end

    it "disconnects the user from its session" do
      collector.update!(user: user)
      patch "/admin/users/#{user.id}/disconnect", headers: admin_auth
      expect(response).to have_http_status(:found)
      expect(collector.reload.user_id).to be_nil
    end
  end

  describe "destroy" do
    it "deletes the user and nullifies its session link" do
      session = Session.create!(user_name: "mauro", user: user)
      expect {
        delete "/admin/users/#{user.id}", headers: admin_auth
      }.to change(User, :count).by(-1)
      expect(Session.exists?(session.id)).to be(true)
      expect(session.reload.user_id).to be_nil
    end
  end
end
