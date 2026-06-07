require "rails_helper"

RSpec.describe "API V1 Album Stickers", type: :request do
  # toggle/sync act on the token user's own album (keyed by session.user_name).
  let(:user) { register_collector(username: "mauro").first }

  # Simulates a user whose scan-session display name differs from their account
  # username (the production bug: "GiacomoPietro" account "giacomopietro").
  let(:display_user) do
    register_collector(username: "giacomopietro", display_name: "GiacomoPietro").first
  end

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
           params: { normalizedCode: "ARG01" }, headers: bearer(user), as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["action"]).to eq("added")
      expect(AlbumSticker.where(user_name: "mauro", normalized_code: "ARG01").count).to eq(1)
    end

    it "removes the sticker when present and returns action:removed" do
      AlbumSticker.create!(user_name: "mauro", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/toggle",
           params: { normalizedCode: "ARG01" }, headers: bearer(user), as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["action"]).to eq("removed")
      expect(AlbumSticker.where(user_name: "mauro", normalized_code: "ARG01").count).to eq(0)
    end

    context "when session display name differs from account username" do
      it "allows toggle when userName matches the session display name" do
        post "/api/v1/album_stickers/toggle",
             params: { userName: "GiacomoPietro", normalizedCode: "KOR03" },
             headers: bearer(display_user), as: :json
        expect(response).to have_http_status(:created)
        expect(AlbumSticker.where(user_name: "GiacomoPietro", normalized_code: "KOR03").count).to eq(1)
      end

      it "allows toggle without userName and stores under the session display name" do
        post "/api/v1/album_stickers/toggle",
             params: { normalizedCode: "KOR03" },
             headers: bearer(display_user), as: :json
        expect(response).to have_http_status(:created)
        expect(AlbumSticker.where(user_name: "GiacomoPietro", normalized_code: "KOR03").count).to eq(1)
      end

      it "returns 403 when userName targets a different user's album" do
        post "/api/v1/album_stickers/toggle",
             params: { userName: "SomeoneElse", normalizedCode: "KOR03" },
             headers: bearer(display_user), as: :json
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/album_stickers/sync" do
    it "stores the full set of owned codes for the token user" do
      post "/api/v1/album_stickers/sync",
           params: { codes: [ "ARG01", "BRA07" ] }, headers: bearer(user), as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["ok"]).to be true
      expect(response.parsed_body["owned"]).to eq(2)
      expect(AlbumSticker.where(user_name: "mauro").count).to eq(2)
    end

    it "removes codes no longer in the set" do
      AlbumSticker.create!(user_name: "mauro", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/sync",
           params: { codes: [ "BRA07" ] }, headers: bearer(user), as: :json

      expect(AlbumSticker.where(user_name: "mauro").pluck(:normalized_code)).to eq([ "BRA07" ])
    end

    it "is idempotent for the same set of codes" do
      post "/api/v1/album_stickers/sync",
           params: { codes: [ "ARG01" ] }, headers: bearer(user), as: :json
      expect {
        post "/api/v1/album_stickers/sync",
             params: { codes: [ "ARG01" ] }, headers: bearer(user), as: :json
      }.not_to change(AlbumSticker, :count)
    end

    it "silently ignores invalid code formats" do
      post "/api/v1/album_stickers/sync",
           params: { codes: [ "ARG01", "invalid", "XX99" ] }, headers: bearer(user), as: :json

      expect(response).to have_http_status(:ok)
      expect(AlbumSticker.where(user_name: "mauro").pluck(:normalized_code)).to eq([ "ARG01" ])
    end

    it "scopes sync to the token user, leaving other users' data intact" do
      AlbumSticker.create!(user_name: "luca", normalized_code: "ARG01", owned_at: Time.current)
      post "/api/v1/album_stickers/sync",
           params: { codes: [ "BRA07" ] }, headers: bearer(user), as: :json

      expect(AlbumSticker.where(user_name: "luca").count).to eq(1)
    end
  end
end
