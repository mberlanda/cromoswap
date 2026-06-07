module AuthHelpers
  # Creates a user + its 1:1 session, mirroring what /auth/register does.
  def register_collector(username: "collector1", password: "supersecret")
    user = User.create!(username: username, password: password)
    session = Session.create!(user_name: username, user: user)
    [ user, session ]
  end

  def bearer(user)
    { "Authorization" => "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
