require "rails_helper"

RSpec.describe "Admin::AlbumStickers", type: :request do
  let!(:sticker) do
    AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
  end

  it "requires authentication" do
    get "/admin/album_stickers"
    expect(response).to have_http_status(:unauthorized)
  end

  it "lists album stickers" do
    get "/admin/album_stickers", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("ARG01")
  end

  it "creates an album sticker" do
    expect {
      post "/admin/album_stickers", params: { album_sticker: {
        user_name: "Luca", normalized_code: "BRA05", owned_at: Time.current
      } }, headers: admin_auth
    }.to change(AlbumSticker, :count).by(1)
    expect(response).to have_http_status(:found)
  end

  it "rejects an invalid code" do
    post "/admin/album_stickers", params: { album_sticker: {
      user_name: "Luca", normalized_code: "nope", owned_at: Time.current
    } }, headers: admin_auth
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "updates an album sticker" do
    patch "/admin/album_stickers/#{sticker.id}", params: { album_sticker: { normalized_code: "BRA07" } }, headers: admin_auth
    expect(sticker.reload.normalized_code).to eq("BRA07")
  end

  it "destroys an album sticker" do
    expect {
      delete "/admin/album_stickers/#{sticker.id}", headers: admin_auth
    }.to change(AlbumSticker, :count).by(-1)
  end
end
