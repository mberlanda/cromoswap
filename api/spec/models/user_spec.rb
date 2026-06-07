require "rails_helper"

RSpec.describe User, type: :model do
  def build_user(**attrs)
    User.new({ username: "collector1", password: "supersecret" }.merge(attrs))
  end

  it "is valid with a username and password" do
    expect(build_user).to be_valid
  end

  it "uses a uuid primary key" do
    user = build_user.tap(&:save!)
    expect(user.id).to match(/\A[0-9a-f-]{36}\z/)
  end

  describe "password" do
    it "hashes the password (has_secure_password)" do
      user = build_user(password: "supersecret").tap(&:save!)
      expect(user.password_digest).to be_present
      expect(user.password_digest).not_to eq("supersecret")
      expect(user.authenticate("supersecret")).to eq(user)
      expect(user.authenticate("wrong")).to be(false)
    end

    it "requires a password" do
      expect(build_user(password: nil)).not_to be_valid
    end

    it "rejects passwords shorter than 8 characters" do
      user = build_user(password: "short12")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "accepts an 8-character password" do
      expect(build_user(password: "exactly8")).to be_valid
    end
  end

  describe "username" do
    it "requires a username" do
      expect(build_user(username: nil)).not_to be_valid
    end

    it "downcases the username before validation" do
      user = build_user(username: "Collector1").tap(&:save!)
      expect(user.username).to eq("collector1")
    end

    it "rejects usernames shorter than 3 characters" do
      expect(build_user(username: "ab")).not_to be_valid
    end

    it "rejects usernames longer than 30 characters" do
      expect(build_user(username: "a" * 31)).not_to be_valid
    end

    it "rejects usernames with non-alphanumeric characters" do
      %w[user_name user-name user.name user\ name USERNAME!].each do |bad|
        expect(build_user(username: bad)).not_to be_valid, "expected #{bad.inspect} to be invalid"
      end
    end

    it "accepts lowercase alphanumeric usernames" do
      expect(build_user(username: "abc123")).to be_valid
    end

    it "enforces case-insensitive uniqueness" do
      build_user(username: "collector1").save!
      dup = build_user(username: "Collector1")
      expect(dup).not_to be_valid
      expect(dup.errors[:username]).to be_present
    end
  end

  describe "association" do
    it "has one session" do
      user = build_user.tap(&:save!)
      session = Session.create!(user_name: "collector1", user: user)
      expect(user.reload.session).to eq(session)
    end
  end
end
