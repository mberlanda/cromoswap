require "rails_helper"

RSpec.describe Session, type: :model do
  it "is valid with a user name" do
    expect(Session.new(user_name: "Mauro")).to be_valid
  end

  it "requires a user name" do
    session = Session.new(user_name: nil)
    expect(session).not_to be_valid
    expect(session.errors[:user_name]).to be_present
  end

  it "uses a uuid primary key" do
    session = Session.create!(user_name: "Mauro")
    expect(session.id).to match(/\A[0-9a-f-]{36}\z/)
  end

  it "has many scans" do
    session = Session.create!(user_name: "Mauro")
    session.scans.create!(normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    expect(session.scans.count).to eq(1)
  end
end
