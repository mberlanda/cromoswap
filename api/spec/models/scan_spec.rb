require "rails_helper"

RSpec.describe Scan, type: :model do
  let(:session) { Session.create!(user_name: "Mauro") }

  def build_scan(attrs = {})
    session.scans.build({ normalized_code: "ARG01", source: "ocr", captured_at: Time.current }.merge(attrs))
  end

  it "is valid with a canonical code, source, and captured_at" do
    expect(build_scan).to be_valid
  end

  it "belongs to a session" do
    scan = Scan.new(normalized_code: "ARG01", source: "ocr", captured_at: Time.current)
    expect(scan).not_to be_valid
    expect(scan.errors[:session]).to be_present
  end

  it "rejects a non-canonical code" do
    expect(build_scan(normalized_code: "arg1")).not_to be_valid
    expect(build_scan(normalized_code: "ARG1")).not_to be_valid
  end

  it "rejects an unknown source" do
    expect(build_scan(source: "guess")).not_to be_valid
  end

  it "requires captured_at" do
    expect(build_scan(captured_at: nil)).not_to be_valid
  end

  it "does not have an image column (images stay on device)" do
    expect(Scan.column_names).not_to include("image", "image_data", "data_url")
  end
end
