require "rails_helper"

RSpec.describe "Security headers", type: :request do
  describe "the SPA document" do
    let(:index_path) { Rails.public_path.join("index.html") }

    around do |example|
      File.write(index_path, "<!doctype html><title>Cromoswap</title>")
      example.run
    ensure
      File.delete(index_path) if File.exist?(index_path)
    end

    before { get "/" }

    it "sets a restrictive Content-Security-Policy" do
      csp = response.headers["Content-Security-Policy"]
      expect(csp).to include("default-src 'self'")
      expect(csp).to include("frame-ancestors 'none'")
      expect(csp).to include("object-src 'none'")
      # OCR runs from self-hosted assets: blob worker + wasm core + same-origin
      # traineddata fetch (see web/scripts/copy-tesseract-assets.mjs).
      expect(csp).to include("script-src 'self' 'wasm-unsafe-eval'")
      expect(csp).to include("worker-src 'self' blob:")
      expect(csp).to include("connect-src 'self'")
      # Captured sticker frames render as canvas/blob/data images.
      expect(csp).to include("img-src 'self' data: blob:")
    end

    it "locks down browser features except the scanner camera" do
      expect(response.headers["Permissions-Policy"]).to include("camera=(self)")
      expect(response.headers["Permissions-Policy"]).to include("microphone=()")
      expect(response.headers["Permissions-Policy"]).to include("geolocation=()")
    end

    it "sets a referrer policy" do
      expect(response.headers["Referrer-Policy"]).to eq("strict-origin-when-cross-origin")
    end
  end

  describe "API responses" do
    it "carry the CSP too (harmless for JSON, covers error pages)" do
      get "/api/v1/leaderboard"
      expect(response.headers["Content-Security-Policy"]).to include("default-src 'self'")
    end
  end
end
