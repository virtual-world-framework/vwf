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
require 'bundler/setup'
require 'sinatra/base'

class VWF < Sinatra::Base
  # use Rack::GoogleAnalytics, :tracker => "UA-xxxxxx-x" # uncomment and add your Google Analytics ID
  not_found do
        if request.path.end_with?('vwf.html') or request.path.end_with?('favicon.ico')
                print "404 Bypass" # TODO: MUST FIX AUTOGEN FILES
        else
                send_file(File.join(File.dirname(__FILE__), 'public', '404.html'), {:status => 404})
        end
  end
end
run VWF
