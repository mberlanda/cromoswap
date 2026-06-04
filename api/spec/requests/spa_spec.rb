require "rails_helper"

RSpec.describe "SPA serving", type: :request do
  let(:index_path) { Rails.public_path.join("index.html") }

  context "when the front end is bundled" do
    around do |example|
      File.write(index_path, "<!doctype html><title>WC 2026 Sticker Scanner</title>")
      example.run
    ensure
      File.delete(index_path) if File.exist?(index_path)
    end

    it "serves index.html at the root" do
      get "/"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Sticker Scanner")
    end

    it "serves index.html for a non-API html path (SPA fallback)" do
      get "/collection", headers: { "Accept" => "text/html" }
      expect(response).to have_http_status(:ok)
    end
  end

  context "when the front end is not bundled" do
    before { File.delete(index_path) if File.exist?(index_path) }

    it "returns a helpful 404" do
      get "/"
      expect(response).to have_http_status(:not_found)
      expect(response.body).to include("not bundled")
    end
  end
end
