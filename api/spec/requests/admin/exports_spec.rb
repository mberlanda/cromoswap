require "rails_helper"

RSpec.describe "Admin::Exports", type: :request do
  before do
    session = Session.create!(user_name: "Mauro")
    Scan.create!(session: session, normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
  end

  describe "GET /admin/export.json" do
    it "requires authentication" do
      get "/admin/export.json"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns all sessions (with scans) and album stickers" do
      get "/admin/export.json", headers: admin_auth
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["sessions"].first["userName"]).to eq("Mauro")
      expect(body["sessions"].first["scans"].first["normalizedCode"]).to eq("ARG01")
      expect(body["albumStickers"].first["normalizedCode"]).to eq("ARG01")
      expect(body).to have_key("exportedAt")
    end
  end

  describe "GET /admin/export.sql" do
    it "streams a SQL dump when pg_dump is available" do
      allow_any_instance_of(Admin::ExportsController).to receive(:pg_dump_available?).and_return(true)
      allow_any_instance_of(Admin::ExportsController).to receive(:generate_pg_dump).and_return("-- DUMP\n")
      get "/admin/export.sql", headers: admin_auth
      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Disposition"]).to include(".sql")
      expect(response.body).to include("-- DUMP")
    end

    it "returns 503 when pg_dump is not available" do
      allow_any_instance_of(Admin::ExportsController).to receive(:pg_dump_available?).and_return(false)
      get "/admin/export.sql", headers: admin_auth
      expect(response).to have_http_status(:service_unavailable)
    end
  end
end
