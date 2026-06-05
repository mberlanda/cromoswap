require "rails_helper"

RSpec.describe "Admin::Collectors", type: :request do
  before do
    mauro = Session.create!(user_name: "Mauro")
    Scan.create!(session: mauro, normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    AlbumSticker.create!(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)

    Session.create!(user_name: "Luca")
    AlbumSticker.create!(user_name: "Luca", normalized_code: "BRA05", owned_at: Time.current)
  end

  it "requires authentication" do
    get "/admin/collectors"
    expect(response).to have_http_status(:unauthorized)
  end

  it "lists collectors with counts" do
    get "/admin/collectors", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Mauro").and include("Luca")
  end

  it "deletes one collector's sessions, scans and album stickers, leaving others intact" do
    expect {
      delete "/admin/collectors/Mauro", headers: admin_auth
    }.to change(Session, :count).by(-1)
      .and change(Scan, :count).by(-1)
      .and change(AlbumSticker, :count).by(-1)

    expect(response).to have_http_status(:found)
    expect(Session.where(user_name: "Luca").count).to eq(1)
    expect(AlbumSticker.where(user_name: "Luca").count).to eq(1)
  end

  # The admin delete button submits POST + _method=delete; Rack::MethodOverride
  # (re-added in application.rb since api_only strips it) must translate it.
  it "honors a POST with _method=delete from the form button" do
    expect {
      post "/admin/collectors/Mauro", params: { _method: "delete" }, headers: admin_auth
    }.to change(Session, :count).by(-1)
    expect(response).to have_http_status(:found)
  end
end
