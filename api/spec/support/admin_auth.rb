module AdminAuthHelpers
  def admin_auth(email = "admin@cromoswap.local", password = "!cromoswap!")
    { "Authorization" => ActionController::HttpAuthentication::Basic.encode_credentials(email, password) }
  end
end

RSpec.configure do |config|
  config.include AdminAuthHelpers, type: :request
end
