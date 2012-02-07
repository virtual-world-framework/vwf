# Specifying versions: http://docs.rubygems.org/read/chapter/16

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

# Allow a prerelease version in order to resolve a websocket-rack warning about eventmachine
# comm_inactivity_timeout. Remove once 1.0.0 is released.

# 1.0.0.beta.4 won't build successfully with RubyInstaller and MinGW.

gem "eventmachine", ">= 1.0.0.beta", "!= 1.0.0.beta.4"
