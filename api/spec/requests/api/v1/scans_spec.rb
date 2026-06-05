require "rails_helper"

RSpec.describe "API V1 Scans", type: :request do
  let(:session) { Session.create!(user_name: "Mauro") }
  let!(:scan) do
    session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
  end

  describe "POST /api/v1/scans" do
    it "creates a scan for the given session" do
      expect {
        post "/api/v1/scans", params: {
          sessionId: session.id,
          normalizedCode: "BRA07",
          source: "manual",
          confidence: 1.0,
          capturedAt: Time.current.iso8601
        }, as: :json
      }.to change(Scan, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["normalizedCode"]).to eq("BRA07")
    end

    it "returns 404 when the session does not exist" do
      post "/api/v1/scans", params: {
        sessionId: "00000000-0000-4000-8000-000000000000",
        normalizedCode: "BRA07",
        source: "ocr",
        capturedAt: Time.current.iso8601
      }, as: :json
      expect(response).to have_http_status(:not_found)
    end

    it "returns 422 for an invalid normalized code" do
      post "/api/v1/scans", params: {
        sessionId: session.id,
        normalizedCode: "bad",
        source: "ocr",
        capturedAt: Time.current.iso8601
      }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /api/v1/scans/:id" do
    it "edits the normalized code" do
      patch "/api/v1/scans/#{scan.id}", params: { normalizedCode: "ARG02" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(scan.reload.normalized_code).to eq("ARG02")
    end

    it "rejects an invalid code" do
      patch "/api/v1/scans/#{scan.id}", params: { normalizedCode: "nope" }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /api/v1/scans/:id" do
    it "removes the scan" do
      expect {
        delete "/api/v1/scans/#{scan.id}"
      }.to change(Scan, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
