require "rails_helper"

RSpec.describe "Admin::Dashboard", type: :request do
  def auth(email = "admin@cromoswap.local", password = "!cromoswap!")
    { "Authorization" => ActionController::HttpAuthentication::Basic.encode_credentials(email, password) }
  end

  describe "GET /admin" do
    it "challenges for credentials when none are given" do
      get "/admin"
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects wrong credentials" do
      get "/admin", headers: auth("admin@cromoswap.local", "wrong")
      expect(response).to have_http_status(:unauthorized)
    end

    it "renders the dashboard with valid credentials" do
      get "/admin", headers: auth
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Backoffice")
    end

    it "is disabled in production while ADMIN_PASSWORD is the default" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))
      get "/admin", headers: auth
      expect(response).to have_http_status(:service_unavailable)
    end
  end
end
