require "rails_helper"

RSpec.describe "API V1 Sessions", type: :request do
  let(:session_id) { "11111111-1111-4111-8111-111111111111" }
  let(:scan_id) { "22222222-2222-4222-8222-222222222222" }

  def payload(extra_scan = {})
    {
      session: { id: session_id, userName: "Mauro", createdAt: "2026-06-01T00:00:00Z" },
      scans: [
        {
          id: scan_id,
          normalizedCode: "ARG01",
          source: "ocr",
          confidence: 0.9,
          capturedAt: "2026-06-04T00:00:00Z",
        }.merge(extra_scan),
      ],
    }
  end

  describe "GET /api/v1/sessions" do
    it "returns sessions matching the given IDs" do
      post "/api/v1/sessions", params: payload, as: :json
      get "/api/v1/sessions?ids[]=#{session_id}"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(1)
      expect(body.first["id"]).to eq(session_id)
      expect(body.first["scanCount"]).to eq(1)
    end

    it "returns an empty array when no IDs are given" do
      get "/api/v1/sessions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end
  end

  describe "POST /api/v1/sessions" do
    it "creates a session and its scans (codes + metadata)" do
      expect {
        post "/api/v1/sessions", params: payload, as: :json
      }.to change(Session, :count).by(1).and change(Scan, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["userName"]).to eq("Mauro")
      expect(body["scans"].first["normalizedCode"]).to eq("ARG01")
    end

    it "creates a session without a client-provided ID" do
      post "/api/v1/sessions", params: { session: { userName: "Alice" }, scans: [] }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["id"]).to be_present
      expect(response.parsed_body["userName"]).to eq("Alice")
    end

    it "is idempotent: re-posting the same ids upserts rather than duplicates" do
      post "/api/v1/sessions", params: payload, as: :json
      expect {
        post "/api/v1/sessions", params: payload, as: :json
      }.not_to change(Scan, :count)
    end

    it "ignores any image fields that are sent" do
      post "/api/v1/sessions", params: payload(imageDataUrl: "data:image/png;base64,AAAA"), as: :json
      expect(response).to have_http_status(:created)
      expect(Scan.column_names).not_to include("image_data_url")
    end
  end

  describe "GET /api/v1/sessions/:id" do
    it "returns the session and its scans" do
      post "/api/v1/sessions", params: payload, as: :json
      get "/api/v1/sessions/#{session_id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["scans"].length).to eq(1)
    end

    it "returns 404 for an unknown session" do
      get "/api/v1/sessions/00000000-0000-4000-8000-000000000000"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/sessions/:session_id/scans" do
    it "returns scans for the session" do
      post "/api/v1/sessions", params: payload, as: :json
      get "/api/v1/sessions/#{session_id}/scans"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(1)
      expect(body.first["normalizedCode"]).to eq("ARG01")
    end
  end
end
