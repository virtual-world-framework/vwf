# Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
# Secretary of Defense (Personnel & Readiness).
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

# Version string format: http://docs.rubygems.org/read/chapter/16

source "http://rubygems.org"

ruby "1.9.3"

gem "sinatra", ">= 1.3", :require => "sinatra/base"
gem "json"
gem "websocket-rack", :require => "rack/websocket"
gem "thin"
gem "rack-google-analytics", :require => "rack/google-analytics"
gem "rack", "1.5.2"

group :development do
  gem "sinatra-reloader", :require => "sinatra/reloader"
end

group :test do
  gem "minitest"
  gem "rack-test", :require => "rack/test"
end

group :build do

  gem "rake"
  gem "rocco"
  gem "kramdown"

  # redcarpet >= 2 no longer declares a Markdown class, which Rocco expects. Having rocco require
  # "redcarpet/compat" for redcarpet >= 2 would probably also fix this.
  
  gem "redcarpet", "< 2"

end

# Allow a prerelease version in order to resolve a websocket-rack warning about eventmachine
# comm_inactivity_timeout. Remove once 1.0.0 is released.

# 1.0.0.beta.4 won't build successfully with RubyInstaller and MinGW.

gem "eventmachine", ">= 1.0.0.beta", "!= 1.0.0.beta.4"
