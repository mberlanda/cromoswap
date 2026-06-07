Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :sessions, only: %i[index create show] do
        resources :scans, only: %i[index], shallow: false
      end
      resources :scans, only: %i[create update destroy]
      post "auth/register", to: "auth#register"
      post "auth/login",    to: "auth#login"
      get  "auth/me",       to: "auth#me"
      post "auth/password", to: "auth#password"
      get  "album_stickers",        to: "album_stickers#index"
      post "album_stickers/toggle", to: "album_stickers#toggle"
      post "album_stickers/sync",   to: "album_stickers#sync"
      get  "leaderboard",           to: "leaderboard#index"
    end
  end

  # Server-rendered backoffice (HTTP Basic auth). Mounted before the SPA catch-all.
  # config.api_only strips :new/:edit from resourceful routes, so add the form
  # pages back explicitly (declared before the namespace so /new wins over /:id).
  %w[sessions scans album_stickers].each do |res|
    singular = res.singularize
    get "/admin/#{res}/new",      to: "admin/#{res}#new",  as: :"new_admin_#{singular}"
    get "/admin/#{res}/:id/edit", to: "admin/#{res}#edit", as: :"edit_admin_#{singular}"
  end

  namespace :admin do
    root "dashboard#index"
    resources :sessions
    resources :scans
    resources :album_stickers
    resources :collectors, only: %i[index destroy], param: :user_name
    # Literal .json/.sql segments (format: false) so each maps to its own action.
    get "export.json", to: "exports#json", as: :export,     format: false
    get "export.sql",  to: "exports#sql",  as: :export_sql, format: false
  end

  # Serve the bundled SPA for the root and any non-API GET path.
  root "spa#index"
  get "*path", to: "spa#index", constraints: lambda { |req|
    !req.path.start_with?("/api/", "/admin", "/up") && req.format.html?
  }

  # Defines the root path route ("/")
  # root "posts#index"
end
