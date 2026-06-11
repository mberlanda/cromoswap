require "rails_helper"

# Rack::Attack is disabled for the rest of the suite (so unrelated specs never
# trip a throttle); these specs opt back in per-example.
RSpec.describe "Rack::Attack rate limiting", type: :request do
  around do |example|
    Rack::Attack.enabled = true
    Rack::Attack.cache.store.clear
    example.run
  ensure
    Rack::Attack.enabled = false
  end

  def attempt_login(ip:)
    post "/api/v1/auth/login",
         params: { username: "ghost", password: "wrongpassword" },
         env: { "REMOTE_ADDR" => ip }
  end

  describe "auth endpoints" do
    it "throttles repeated attempts from one IP with a JSON 429 + Retry-After" do
      10.times do
        attempt_login(ip: "10.9.0.1")
        expect(response).to have_http_status(:unauthorized)
      end

      attempt_login(ip: "10.9.0.1")
      expect(response).to have_http_status(:too_many_requests)
      expect(response.headers["Retry-After"]).to be_present
      expect(JSON.parse(response.body)["error"]).to eq("rate limited")
    end

    it "does not throttle an unrelated IP" do
      10.times { attempt_login(ip: "10.9.0.2") }
      attempt_login(ip: "10.9.0.3")
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "API writes" do
    it "throttles sustained writes from one IP" do
      120.times do
        post "/api/v1/scans", env: { "REMOTE_ADDR" => "10.9.0.4" }
        expect(response).to have_http_status(:unauthorized)
      end

      post "/api/v1/scans", env: { "REMOTE_ADDR" => "10.9.0.4" }
      expect(response).to have_http_status(:too_many_requests)
    end

    it "leaves public reads unthrottled" do
      125.times { get "/api/v1/leaderboard", env: { "REMOTE_ADDR" => "10.9.0.5" } }
      get "/api/v1/leaderboard", env: { "REMOTE_ADDR" => "10.9.0.5" }
      expect(response).to have_http_status(:ok)
    end
  end
end
