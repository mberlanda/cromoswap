module AuthHelpers
  # Creates a user + its 1:1 session, mirroring what /auth/register does.
  # Pass display_name to simulate a session whose user_name differs from the
  # account username (e.g. "GiacomoPietro" registered as "giacomopietro").
  def register_collector(username: "collector1", password: "supersecret", display_name: nil)
    user = User.create!(username: username, password: password)
    session = Session.create!(user_name: display_name || user.username, user: user)
    [ user, session ]
  end

  def bearer(user)
    { "Authorization" => "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
