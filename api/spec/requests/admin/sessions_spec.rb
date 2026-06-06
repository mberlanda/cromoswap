require "rails_helper"

RSpec.describe "Admin::Sessions", type: :request do
  let!(:session) { Session.create!(user_name: "Mauro") }

  it "requires authentication" do
    get "/admin/sessions"
    expect(response).to have_http_status(:unauthorized)
  end

  it "lists sessions" do
    get "/admin/sessions", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Mauro")
  end

  it "shows a session with its scans" do
    Scan.create!(session: session, normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    get "/admin/sessions/#{session.id}", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("ARG01")
  end

  it "creates a session" do
    expect {
      post "/admin/sessions", params: { session: { user_name: "Luca" } }, headers: admin_auth
    }.to change(Session, :count).by(1)
    expect(response).to have_http_status(:found)
  end

  it "re-renders new on invalid create" do
    post "/admin/sessions", params: { session: { user_name: "" } }, headers: admin_auth
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "updates a session" do
    patch "/admin/sessions/#{session.id}", params: { session: { user_name: "Renamed" } }, headers: admin_auth
    expect(response).to have_http_status(:found)
    expect(session.reload.user_name).to eq("Renamed")
  end

  it "re-renders edit on an invalid update" do
    patch "/admin/sessions/#{session.id}", params: { session: { user_name: "" } }, headers: admin_auth
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "destroys a session and its scans" do
    Scan.create!(session: session, normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    expect {
      delete "/admin/sessions/#{session.id}", headers: admin_auth
    }.to change(Session, :count).by(-1).and change(Scan, :count).by(-1)
    expect(response).to have_http_status(:found)
  end
end
