source :rubygems

gem "sinatra", ">= 1.3", :require => "sinatra/base"
gem "json"

gem "websocket-rack", :require => "rack/websocket"

gem "thin"

group :development do
  gem "sinatra-reloader", :require => "sinatra/reloader"
  gem "rocco" # for documentation builds
end

group :test do
  gem "rack-test", :require => "rack/test"
end

# allow a prerelease version in order to resolve websocket-rack warning about eventmachine
# comm_inactivity_timeout; remove once 1.0.0 is released.

gem "eventmachine", ">= 1.0.0.beta"
