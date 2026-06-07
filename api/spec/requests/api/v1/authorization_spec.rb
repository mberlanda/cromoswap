require "rails_helper"

# Phase 4 — writes require a token and are scoped to the token's user/session.
# Reads (leaderboard, album index, session reads) stay public.
RSpec.describe "API V1 write authorization", type: :request do
  let(:json) { response.parsed_body }

  let(:owner_pair) { register_collector(username: "owner") }
  let(:owner) { owner_pair[0] }
  let(:owner_session) { owner_pair[1] }

  let(:other_pair) { register_collector(username: "intruder") }
  let(:other) { other_pair[0] }
  let(:other_session) { other_pair[1] }

  describe "POST /api/v1/scans" do
    let(:params) do
      { sessionId: owner_session.id, normalizedCode: "BRA07", source: "ocr", capturedAt: Time.current.iso8601 }
    end

    it "401s without a token" do
      post "/api/v1/scans", params: params, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a scan in the token user's own session" do
      expect {
        post "/api/v1/scans", params: params, headers: bearer(owner), as: :json
      }.to change { owner_session.scans.count }.by(1)
      expect(response).to have_http_status(:created)
    end

    it "403s when sessionId belongs to another user" do
      post "/api/v1/scans",
           params: params.merge(sessionId: other_session.id),
           headers: bearer(owner), as: :json
      expect(response).to have_http_status(:forbidden)
      expect(other_session.scans.count).to eq(0)
    end
  end

  describe "PATCH/DELETE /api/v1/scans/:id" do
    let!(:own_scan) { owner_session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current) }
    let!(:foreign_scan) { other_session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current) }

    it "edits the user's own scan" do
      patch "/api/v1/scans/#{own_scan.id}", params: { normalizedCode: "ARG02" }, headers: bearer(owner), as: :json
      expect(response).to have_http_status(:ok)
      expect(own_scan.reload.normalized_code).to eq("ARG02")
    end

    it "404s editing another user's scan (scoped finder)" do
      patch "/api/v1/scans/#{foreign_scan.id}", params: { normalizedCode: "ARG02" }, headers: bearer(owner), as: :json
      expect(response).to have_http_status(:not_found)
      expect(foreign_scan.reload.normalized_code).to eq("ARG01")
    end

    it "404s deleting another user's scan" do
      expect {
        delete "/api/v1/scans/#{foreign_scan.id}", headers: bearer(owner)
      }.not_to change(Scan, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "401s without a token" do
      patch "/api/v1/scans/#{own_scan.id}", params: { normalizedCode: "ARG02" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/album_stickers/toggle" do
    it "401s without a token" do
      post "/api/v1/album_stickers/toggle", params: { normalizedCode: "ARG01" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "adds to the token user's own album (client userName ignored/derived)" do
      post "/api/v1/album_stickers/toggle", params: { normalizedCode: "ARG01" }, headers: bearer(owner), as: :json
      expect(response).to have_http_status(:created)
      expect(AlbumSticker.where(user_name: "owner", normalized_code: "ARG01").count).to eq(1)
    end

    it "403s when userName targets another collector" do
      post "/api/v1/album_stickers/toggle",
           params: { userName: "intruder", normalizedCode: "ARG01" },
           headers: bearer(owner), as: :json
      expect(response).to have_http_status(:forbidden)
      expect(AlbumSticker.where(user_name: "intruder").count).to eq(0)
    end

    it "cannot hijack another album by first renaming the session" do
      # Attempt to rename the session to the victim's name (must be ignored)...
      post "/api/v1/sessions", params: { session: { userName: "intruder" }, scans: [] },
                               headers: bearer(owner), as: :json
      # ...then a token-scoped album write still lands in the owner's album.
      post "/api/v1/album_stickers/toggle", params: { normalizedCode: "ARG01" },
                                            headers: bearer(owner), as: :json
      expect(AlbumSticker.where(user_name: "intruder").count).to eq(0)
      expect(AlbumSticker.where(user_name: "owner", normalized_code: "ARG01").count).to eq(1)
    end
  end

  describe "POST /api/v1/album_stickers/sync" do
    it "401s without a token" do
      post "/api/v1/album_stickers/sync", params: { codes: [ "ARG01" ] }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "syncs the token user's own album" do
      post "/api/v1/album_stickers/sync", params: { codes: [ "ARG01", "BRA07" ] }, headers: bearer(owner), as: :json
      expect(response).to have_http_status(:ok)
      expect(AlbumSticker.where(user_name: "owner").count).to eq(2)
    end

    it "403s when userName targets another collector" do
      post "/api/v1/album_stickers/sync",
           params: { userName: "intruder", codes: [ "ARG01" ] },
           headers: bearer(owner), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/sessions" do
    it "401s without a token" do
      post "/api/v1/sessions", params: { session: { userName: "owner" }, scans: [] }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "upserts scans into the token user's own session, ignoring a client id" do
      post "/api/v1/sessions",
           params: {
             session: { id: "99999999-9999-4999-8999-999999999999", userName: "owner" },
             scans: [ { id: SecureRandom.uuid, normalizedCode: "ARG01", source: "ocr", capturedAt: Time.current.iso8601 } ]
           },
           headers: bearer(owner), as: :json
      expect(response).to have_http_status(:created)
      expect(json["id"]).to eq(owner_session.id)
      expect(owner_session.scans.count).to eq(1)
    end
  end

  describe "public reads stay open (no token)" do
    before do
      owner_session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
      AlbumSticker.create!(user_name: "owner", normalized_code: "ARG01", owned_at: Time.current)
    end

    it "GET /api/v1/leaderboard" do
      get "/api/v1/leaderboard"
      expect(response).to have_http_status(:ok)
    end

    it "GET /api/v1/album_stickers" do
      get "/api/v1/album_stickers?user_name=owner"
      expect(response).to have_http_status(:ok)
    end

    it "GET /api/v1/sessions and /:id and /:id/scans" do
      get "/api/v1/sessions?ids[]=#{owner_session.id}"
      expect(response).to have_http_status(:ok)
      get "/api/v1/sessions/#{owner_session.id}"
      expect(response).to have_http_status(:ok)
      get "/api/v1/sessions/#{owner_session.id}/scans"
      expect(response).to have_http_status(:ok)
    end
  end
end
