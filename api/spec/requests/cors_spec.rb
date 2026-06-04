require "rails_helper"

# CORS lets the web app sync from a separate origin (e.g. a Vite dev server or a
# separately-hosted front end). Allowed origins come from CORS_ORIGINS, with
# localhost dev ports allowed by default.
RSpec.describe "CORS", type: :request do
  let(:allowed_origin) { "http://localhost:5173" }

  it "echoes the allowed origin on an API request" do
    get "/api/v1/sessions/#{SecureRandom.uuid}", headers: { "Origin" => allowed_origin }
    expect(response.headers["Access-Control-Allow-Origin"]).to eq(allowed_origin)
  end

  it "answers a preflight request with the allowed methods" do
    process :options, "/api/v1/sessions",
      headers: {
        "Origin" => allowed_origin,
        "Access-Control-Request-Method" => "POST",
      }
    expect(response.headers["Access-Control-Allow-Origin"]).to eq(allowed_origin)
    expect(response.headers["Access-Control-Allow-Methods"]).to include("POST")
  end

  it "does not allow an unlisted origin" do
    get "/api/v1/sessions/#{SecureRandom.uuid}", headers: { "Origin" => "http://evil.example" }
    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
  end
end
