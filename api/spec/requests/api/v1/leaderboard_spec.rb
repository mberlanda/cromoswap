require "rails_helper"

RSpec.describe "API V1 Leaderboard", type: :request do
  before do
    AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
    AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG02", owned_at: Time.current)
    AlbumSticker.create!(user_name: "Luca", normalized_code: "BRA01", owned_at: Time.current)
  end

  describe "GET /api/v1/leaderboard" do
    it "returns users sorted by owned count descending" do
      get "/api/v1/leaderboard"
      expect(response).to have_http_status(:ok)

      entries = response.parsed_body
      expect(entries.first["userName"]).to eq("Mauro")
      expect(entries.first["owned"]).to eq(2)
      expect(entries.first["missing"]).to eq(978)
      expect(entries.second["userName"]).to eq("Luca")
      expect(entries.second["owned"]).to eq(1)
      expect(entries.second["missing"]).to eq(979)
    end

    it "returns an empty array when no album data exists" do
      AlbumSticker.delete_all
      get "/api/v1/leaderboard"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end
  end
end
