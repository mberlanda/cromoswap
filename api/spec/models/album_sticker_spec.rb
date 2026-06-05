require "rails_helper"

RSpec.describe AlbumSticker, type: :model do
  let(:valid) do
    AlbumSticker.new(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
  end

  it "is valid with a user_name, a valid code, and owned_at" do
    expect(valid).to be_valid
  end

  it "requires user_name" do
    valid.user_name = nil
    expect(valid).not_to be_valid
  end

  it "requires normalized_code to match the album format" do
    valid.normalized_code = "invalid"
    expect(valid).not_to be_valid
  end

  it "enforces uniqueness of code per user" do
    valid.save!
    duplicate = AlbumSticker.new(user_name: "Mauro", normalized_code: "ARG01", owned_at: Time.current)
    expect(duplicate).not_to be_valid
  end
end
