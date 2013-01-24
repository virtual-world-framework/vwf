# Copyright 2013 United States Government, as represented by the Secretary of Defense, Under
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
#
# This is an EXPERIMENTAL module to support POSTs to the VWF persistence directory. There is virtually
# no protection against overwriting any file in ^/public, and potentially elsewhere on the server.
# DO NOT ENABLE ON A PRODUCTION SERVER.

class VWF::Application::Persistence < Sinatra::Base

  def initialize root
    super nil
    @root = root
  end

  post "/*" do

    pass unless settings.development? # only in development mode

    File.open('public/'+params["root"]+'/'+params["filename"]+'.vwf.json', 'w') {|f| f.write(params["jsonState"]) }
    File.open('public/'+params["root"]+'/'+params["filename"]+'_'+params["inst"]+'_'+params["timestamp"]+'.vwf.json', 'w') {|f| f.write(params["jsonState"]) }

  end

end
