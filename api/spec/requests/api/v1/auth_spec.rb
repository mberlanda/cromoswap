require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  let(:json) { JSON.parse(response.body) }

  describe "POST /api/v1/auth/register" do
    it "creates a user + session and returns a token" do
      post "/api/v1/auth/register", params: { username: "collector1", password: "supersecret" }

      expect(response).to have_http_status(:created)
      expect(json["token"]).to be_present
      expect(json["user"]).to include("username" => "collector1")
      # password must never leak — guard the real attribute name, not just camelCase
      expect(json["user"]).not_to have_key("password_digest")
      expect(json["user"]).not_to have_key("passwordDigest")
      expect(json["session"]).to include("userName" => "collector1")

      user = User.find_by(username: "collector1")
      expect(user.session.id).to eq(json["session"]["id"])
      expect(JsonWebToken.decode(json["token"])["user_id"]).to eq(user.id)
    end

    it "downcases the username" do
      post "/api/v1/auth/register", params: { username: "Collector1", password: "supersecret" }
      expect(json["user"]["username"]).to eq("collector1")
    end

    it "422s on a duplicate username (case-insensitive)" do
      User.create!(username: "collector1", password: "supersecret")
      post "/api/v1/auth/register", params: { username: "Collector1", password: "supersecret" }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to be_present
    end

    it "422s on an invalid username format" do
      post "/api/v1/auth/register", params: { username: "bad name!", password: "supersecret" }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "422s on a weak password" do
      post "/api/v1/auth/register", params: { username: "collector1", password: "short" }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { User.create!(username: "collector1", password: "supersecret") }
    let!(:session) { Session.create!(user_name: "collector1", user: user) }

    it "returns a token + the user's session for valid credentials" do
      post "/api/v1/auth/login", params: { username: "Collector1", password: "supersecret" }
      expect(response).to have_http_status(:ok)
      expect(json["token"]).to be_present
      expect(json["user"]["username"]).to eq("collector1")
      expect(json["session"]["id"]).to eq(session.id)
    end

    it "returns session: null when the user has no session yet" do
      User.create!(username: "lonely", password: "supersecret")
      post "/api/v1/auth/login", params: { username: "lonely", password: "supersecret" }
      expect(response).to have_http_status(:ok)
      expect(json["session"]).to be_nil
    end

    it "401s on a wrong password" do
      post "/api/v1/auth/login", params: { username: "collector1", password: "nope" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "401s on an unknown username" do
      post "/api/v1/auth/login", params: { username: "ghost", password: "supersecret" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "still digests the password for an unknown username (no timing oracle)" do
      expect(BCrypt::Password).to receive(:create).at_least(:once).and_call_original
      post "/api/v1/auth/login", params: { username: "ghost", password: "supersecret" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "401s on a blank password without leaking whether the user exists" do
      post "/api/v1/auth/login", params: { username: "collector1", password: "" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/auth/me" do
    let!(:user) { User.create!(username: "collector1", password: "supersecret") }
    let!(:session) { Session.create!(user_name: "collector1", user: user) }
    let(:token) { JsonWebToken.encode(user_id: user.id) }

    it "returns the current user + session with a valid token" do
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(json["user"]["username"]).to eq("collector1")
      expect(json["session"]["id"]).to eq(session.id)
    end

    it "401s without a token" do
      get "/api/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end

    it "401s with an invalid token" do
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer garbage" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/password" do
    let!(:user) { User.create!(username: "collector1", password: "supersecret") }
    let(:token) { JsonWebToken.encode(user_id: user.id) }

    it "changes the password with the correct current password" do
      post "/api/v1/auth/password",
           params: { currentPassword: "supersecret", newPassword: "brandnew123" },
           headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(user.reload.authenticate("brandnew123")).to be_truthy
    end

    it "422s when the current password is wrong" do
      post "/api/v1/auth/password",
           params: { currentPassword: "wrong", newPassword: "brandnew123" },
           headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.authenticate("supersecret")).to be_truthy
    end

    it "422s when the new password is too weak" do
      post "/api/v1/auth/password",
           params: { currentPassword: "supersecret", newPassword: "short" },
           headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "401s without a token" do
      post "/api/v1/auth/password", params: { currentPassword: "supersecret", newPassword: "brandnew123" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
