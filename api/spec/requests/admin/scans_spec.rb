require "rails_helper"

RSpec.describe "Admin::Scans", type: :request do
  let!(:session) { Session.create!(user_name: "Mauro") }
  let!(:scan) do
    Scan.create!(session: session, normalized_code: "ARG01", source: "ocr", confidence: 0.9, captured_at: Time.current)
  end

  it "requires authentication" do
    get "/admin/scans"
    expect(response).to have_http_status(:unauthorized)
  end

  it "lists scans" do
    get "/admin/scans", headers: admin_auth
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("ARG01")
  end

  it "creates a scan" do
    expect {
      post "/admin/scans", params: { scan: {
        session_id: session.id, normalized_code: "USA13", source: "manual",
        confidence: 1, captured_at: Time.current
      } }, headers: admin_auth
    }.to change(Scan, :count).by(1)
    expect(response).to have_http_status(:found)
  end

  it "rejects an invalid code" do
    post "/admin/scans", params: { scan: {
      session_id: session.id, normalized_code: "bad", source: "manual", captured_at: Time.current
    } }, headers: admin_auth
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "updates a scan" do
    patch "/admin/scans/#{scan.id}", params: { scan: { normalized_code: "BRA07" } }, headers: admin_auth
    expect(scan.reload.normalized_code).to eq("BRA07")
  end

  it "re-renders edit on an invalid update" do
    patch "/admin/scans/#{scan.id}", params: { scan: { normalized_code: "bad" } }, headers: admin_auth
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "destroys a scan" do
    expect {
      delete "/admin/scans/#{scan.id}", headers: admin_auth
    }.to change(Scan, :count).by(-1)
  end
end
