require "rails_helper"

RSpec.describe "API V1 Album Stickers", type: :request do
  describe "GET /api/v1/album_stickers" do
    it "returns owned stickers for the given user" do
      AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
      AlbumSticker.create!(user_name: "Mauro", normalized_code: "BRA07", owned_at: Time.current)
      AlbumSticker.create!(user_name: "Alice", normalized_code: "ARG01", owned_at: Time.current)

      get "/api/v1/album_stickers?user_name=Mauro"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.map { |s| s["normalizedCode"] }).to contain_exactly("ARG01", "BRA07")
    end

    it "returns an empty array for a user with no stickers" do
      get "/api/v1/album_stickers?user_name=Nobody"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end
  end

  describe "POST /api/v1/album_stickers/toggle" do
    it "adds the sticker when absent and returns action:added" do
      post "/api/v1/album_stickers/toggle",
           params: { userName: "Mauro", normalizedCode: "ARG01" }, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["action"]).to eq("added")
      expect(AlbumSticker.where(user_name: "Mauro", normalized_code: "ARG01").count).to eq(1)
    end

    it "removes the sticker when present and returns action:removed" do
      AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/toggle",
           params: { userName: "Mauro", normalizedCode: "ARG01" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["action"]).to eq("removed")
      expect(AlbumSticker.where(user_name: "Mauro", normalized_code: "ARG01").count).to eq(0)
    end
  end

  describe "POST /api/v1/album_stickers/sync" do
    it "stores the full set of owned codes for a user" do
      post "/api/v1/album_stickers/sync",
           params: { userName: "Mauro", codes: [ "ARG01", "BRA07" ] }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["ok"]).to be true
      expect(response.parsed_body["owned"]).to eq(2)
      expect(AlbumSticker.where(user_name: "Mauro").count).to eq(2)
    end

    it "removes codes no longer in the set" do
      AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/sync",
           params: { userName: "Mauro", codes: [ "BRA07" ] }, as: :json

      expect(AlbumSticker.where(user_name: "Mauro").pluck(:normalized_code)).to eq([ "BRA07" ])
    end

    it "is idempotent for the same set of codes" do
      post "/api/v1/album_stickers/sync",
           params: { userName: "Mauro", codes: [ "ARG01" ] }, as: :json
      expect {
        post "/api/v1/album_stickers/sync",
             params: { userName: "Mauro", codes: [ "ARG01" ] }, as: :json
      }.not_to change(AlbumSticker, :count)
    end

    it "silently ignores invalid code formats" do
      post "/api/v1/album_stickers/sync",
           params: { userName: "Mauro", codes: [ "ARG01", "invalid", "XX99" ] }, as: :json

      expect(response).to have_http_status(:ok)
      expect(AlbumSticker.where(user_name: "Mauro").pluck(:normalized_code)).to eq([ "ARG01" ])
    end

    it "scopes sync to the given user, leaving other users' data intact" do
      AlbumSticker.create!(user_name: "Luca", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/sync",
           params: { userName: "Mauro", codes: [ "BRA07" ] }, as: :json

      expect(AlbumSticker.where(user_name: "Luca").count).to eq(1)
    end
  end
end
