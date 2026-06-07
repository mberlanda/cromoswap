module AuthHelpers
  # Creates a user + its 1:1 session, mirroring what /auth/register does.
  def register_collector(username: "collector1", password: "supersecret")
    user = User.create!(username: username, password: password)
    # Use the normalized username so session.user_name matches the token identity.
    session = Session.create!(user_name: user.username, user: user)
    [ user, session ]
  end

  def bearer(user)
    { "Authorization" => "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
