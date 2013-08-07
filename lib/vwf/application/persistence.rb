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

  get "/listsaves" do
    directory = Rack::Directory.new('documents')
    directory._call({'SCRIPT_NAME'=>request.scheme+'://'+request.host_with_port, 'PATH_INFO'=>request.env["vwf.root"]})
    dirContents = directory.list_directory[2].files 
    result = []
    dirContents.each do |dirContent|
      if dirContent[3] == "directory"
        sub_directory = Rack::Directory.new('documents')
        sub_directory._call({'SCRIPT_NAME'=>request.scheme+'://'+request.host_with_port, 'PATH_INFO'=>request.env["vwf.root"]+"/"+dirContent[1]})
        subDirContents = sub_directory.list_directory[2].files
        revision_list = []
        subDirContents.each do |subDirContent|
          if subDirContent[3] == "application/json"
            if subDirContent[1].length > 18
              if subDirContent[1].slice(0,10) == "saveState_" and subDirContent[1].slice(subDirContent[1].length() - 9, 9) == ".vwf.json"
                potentialTimestamp = subDirContent[1].slice(10, subDirContent[1].length() - 19)
                timestamp = Integer(potentialTimestamp) rescue nil
                if timestamp
                  revision_list.push( timestamp )
                end
              end
            end
          end
        end
        if revision_list.length > 0
          baseName = dirContent[1]
          if baseName.slice(baseName.length - 1) == "/"
            baseName = baseName.slice(0, baseName.length - 1)
          end
          revision_list.sort!
          firstEntry = true
          while revision_list.length > 0
            entry = revision_list.pop
            result.push({ "applicationpath" => request.env["vwf.root"], "savename" => baseName, "revision"=> entry, "latestsave"=>firstEntry })
            firstEntry = false
          end
        end
      end
    end 
    result.compact
    result.to_json
  end

  post "*/save/:savename" do

    pass unless settings.development? # only in development mode
    public_path = "documents"
    segments = env["vwf.root"].split("/")
    segments.push(params[:savename])
    segments.each do |segment|
      public_path = public_path + "/" + segment
      unless File.directory? public_path
        FileUtils.mkdir_p public_path
      end
    end
    
    f = File.open('documents/'+env["vwf.root"]+'/'+params[:savename]+"/saveState"+params["extension"], 'w')
    f.puts params["jsonState"]
    f.close

    f = File.open('documents/'+env["vwf.root"]+'/'+params[:savename]+"/saveState_"+Time.now.utc.to_i.to_s+params["extension"], 'w')
    f.puts params["jsonState"]
    f.close

  end

end
