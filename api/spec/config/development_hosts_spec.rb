require "open3"
require "spec_helper"

RSpec.describe "development host authorization" do
  it "allows the Render app host" do
    stdout, stderr, status = Open3.capture3(
      { "RAILS_ENV" => "development" },
      Gem.ruby,
      "bin/rails",
      "runner",
      "puts Rails.application.config.hosts.inspect"
    )

    expect(status).to be_success, stderr
    expect(stdout).to include("cromoswap.onrender.com")
  end
end
