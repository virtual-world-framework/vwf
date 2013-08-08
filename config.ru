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

require File.expand_path File.join File.dirname( __FILE__ ), "init"

class VWF < Sinatra::Base  
  # use Rack::GoogleAnalytics, :tracker => "UA-xxxxxx-x" # uncomment and add your Google Analytics ID
  configure do
    enable :static_cache_control
  end
 
  get(/.+/) do
    send_sinatra_file(request.path)
  end
 
  not_found do
    send_file(File.join(File.dirname(__FILE__), 'public', '404.html'), {:status => 404})
  end
 
  def send_sinatra_file(path)
	if path =~ /\.[a-z]+.[a-z]+$/i
		file_path = File.join(File.dirname(__FILE__), 'public',  path)
		file_path = File.join(file_path, 'index.html') unless file_path =~ /\.[a-z]+$/i and !File.directory?(file_path) 
		File.exist?(file_path) ? send_file(file_path) : not_found
	end
  end
 
end
 
run VWF
