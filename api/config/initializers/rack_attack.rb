# Rate limiting (see SECURITY.md). Two per-IP throttles:
#
#   * auth endpoints (login/register/password): tight — these are the
#     brute-force / account-spam surface.
#   * all API writes: generous — normal sync bursts stay well under it, but
#     unauthenticated spam can't hammer the database.
#
# Public reads (leaderboard, album, session views) stay unthrottled. Counters
# live in a dedicated in-process MemoryStore (the app's Rails.cache is a
# null_store in test and memory_store elsewhere anyway); with a multi-process
# deployment the effective limit is per process, which is fine for this app's
# single-instance deploy — swap in a shared store if that changes.
Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

AUTH_LIMIT = Integer(ENV.fetch("RACK_ATTACK_AUTH_LIMIT", 10))
WRITE_LIMIT = Integer(ENV.fetch("RACK_ATTACK_WRITE_LIMIT", 120))

Rack::Attack.throttle("auth/ip", limit: AUTH_LIMIT, period: 1.minute) do |req|
  req.ip if req.post? && req.path.start_with?("/api/v1/auth/")
end

Rack::Attack.throttle("writes/ip", limit: WRITE_LIMIT, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/") && %w[POST PUT PATCH DELETE].include?(req.request_method)
end

# JSON 429 with Retry-After so well-behaved clients can back off.
Rack::Attack.throttled_responder = lambda do |request|
  match_data = request.env["rack.attack.match_data"]
  now = match_data[:epoch_time]
  retry_after = match_data[:period] - (now % match_data[:period])

  [
    429,
    { "content-type" => "application/json", "retry-after" => retry_after.to_s },
    [ { error: "rate limited" }.to_json ]
  ]
end

# Throttling is opt-in per example in specs (spec/requests/rack_attack_spec.rb)
# so the rest of the suite can't trip a limit.
Rack::Attack.enabled = false if Rails.env.test?
