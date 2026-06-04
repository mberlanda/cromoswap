# Serves the bundled single-page app (web/dist copied into public/) for the
# root and any non-API path, so the front end and API share one origin.
class SpaController < ActionController::Base
  def index
    index_path = Rails.public_path.join("index.html")
    if File.exist?(index_path)
      send_file index_path, type: "text/html", disposition: "inline"
    else
      render plain: "Front end not bundled. Run the web build into public/.", status: :not_found
    end
  end
end
