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
      get  'album_stickers',        to: 'album_stickers#index'
      post 'album_stickers/toggle', to: 'album_stickers#toggle'
      post 'album_stickers/sync',   to: 'album_stickers#sync'
      get  'leaderboard',           to: 'leaderboard#index'
    end
  end

  # Serve the bundled SPA for the root and any non-API GET path.
  root "spa#index"
  get "*path", to: "spa#index", constraints: lambda { |req|
    !req.path.start_with?("/api/", "/up") && req.format.html?
  }

  # Defines the root path route ("/")
  # root "posts#index"
end
