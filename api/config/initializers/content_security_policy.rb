# Content-Security-Policy for everything the app serves: the bundled SPA
# (public/), the admin backoffice, and (harmlessly) the JSON API. The api_only
# middleware stack omits the CSP middleware, so config/application.rb inserts
# it explicitly (Permissions-Policy/Referrer-Policy live in
# lib/middleware/security_headers.rb).
#
# The SPA needs more than a bare default-src 'self':
#   * tesseract.js OCR spawns a blob: worker, compiles wasm
#     ('wasm-unsafe-eval'), and fetches its core/lang assets same-origin
#     (self-hosted, see web/scripts/copy-tesseract-assets.mjs).
#   * captured frames are drawn to canvases and rendered via data:/blob: URLs.
#   * React styles elements inline ('unsafe-inline' on style-src only).
#
# When a Rails-served bundle must call an API on another origin (it defaults to
# same-origin), add that origin via CSP_CONNECT_SRC (comma-separated).
Rails.application.configure do
  extra_connect = ENV.fetch("CSP_CONNECT_SRC", "").split(",").map(&:strip).reject(&:empty?)

  config.content_security_policy do |policy|
    policy.default_src    :self
    policy.base_uri       :self
    policy.font_src       :self, :data
    policy.form_action    :self
    policy.frame_ancestors :none
    policy.img_src        :self, :data, :blob
    policy.media_src      :self, :blob
    policy.object_src     :none
    policy.script_src     :self, :wasm_unsafe_eval
    policy.style_src      :self, :unsafe_inline
    policy.worker_src     :self, :blob
    policy.connect_src    :self, *extra_connect
  end
end
