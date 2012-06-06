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

require "tilt/vwf"

class VWF::Application::Component < Sinatra::Base

  def initialize root
    super nil
    @root = root
  end

  configure do
    mime_type :json, "application/json"  # TODO: already in Rack::Mime.MIME_TYPES?
    mime_type :jsonp, "application/javascript"
  end

  get /\.vwf$/ do
    begin
      json request.path_info.to_sym  # TODO: path_info is escaped; used route instead?
    rescue Errno::ENOENT  # TODO: there must be a better way to do this
      begin
        yaml request.path_info.to_sym  # TODO: path_info is escaped; used route instead?
      rescue Errno::ENOENT  # TODO: there must be a better way to do this
        404
      end
    end
  end

  helpers do

    def json template, options = {}, locals = {}
      render :json, template, options.merge( component_options ), locals
    end

    def yaml template, options = {}, locals = {}
      render :yaml, template, options.merge( component_options ), locals
    end

  private

    def component_options
      if callback = params["callback"]
        { :layout => false, :views => @root, :default_content_type => :jsonp, :callback => callback }
      else
        { :layout => false, :views => @root, :default_content_type => :json }
      end
    end

  end

end
