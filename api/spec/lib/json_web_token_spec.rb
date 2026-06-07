require "rails_helper"

RSpec.describe JsonWebToken do
  it "round-trips a payload" do
    token = described_class.encode(user_id: "abc")
    expect(described_class.decode(token)["user_id"]).to eq("abc")
  end

  it "sets a default 30-day expiry" do
    token = described_class.encode(user_id: "abc")
    exp = described_class.decode(token)["exp"]
    expect(exp).to be_within(60).of(30.days.from_now.to_i)
  end

  it "returns nil for a tampered/invalid token" do
    expect(described_class.decode("not.a.token")).to be_nil
  end

  it "returns nil for an expired token" do
    token = described_class.encode({ user_id: "abc" }, 1.hour.ago)
    expect(described_class.decode(token)).to be_nil
  end

  it "rejects a token signed with a different secret" do
    forged = JWT.encode({ user_id: "abc" }, "wrong-secret", "HS256")
    expect(described_class.decode(forged)).to be_nil
  end
end
