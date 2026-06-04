require "rails_helper"

RSpec.describe "API V1 Scans", type: :request do
  let(:session) { Session.create!(user_name: "Mauro") }
  let!(:scan) do
    session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
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
