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

require "erb"
require "yaml"

class VWF::Application::Admin < Sinatra::Base

  configure do
    set :root, VWF.settings.root
  end

  # get "/state" do  # TODO: restore when next handler is switched back to post
  # 
  #   if transport = Rack::SocketIO::Application.session( env )[:transport]
  #     transport.state.to_json
  #   end
  # 
  # end

  get "/state" do  # TODO: switch to post; find substitute for query_string to parse

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      state = Rack::Utils.parse_query request.query_string
      state[:rate] = state["rate"].to_f unless state["rate"].nil? || state["rate"].empty?
      transport.rate = state[:rate] unless state[:rate].nil? || state[:rate] == 0
      # TODO: other fields
      transport.state.to_json
    end

  end

  post "/time" do

    # TODO?

  end

  post "/rate" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      body = request.body.read
      rate = body.to_f unless body.empty?
      transport.rate = rate unless rate.nil? || rate == 0
      transport.state.to_json
    end

  end

  post "/play" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.play
      transport.state.to_json
    end

  end

  post "/pause" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.pause
      transport.state.to_json
    end

  end

  post "/stop" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.stop
      transport.state.to_json
    end

  end

  # Instances derived from this application, clients connected to those instances, and client
  # details (none currently).

  get "/instances" do

    Hash[ *
      VWF::Application::Reflector.instances( env ).map do |resource, instance|
        [ resource, Hash[ :clients => Hash[ * instance[:clients].map { |client| [ client.id, nil ] } .flatten( 1 ) ] ] ]
      end .flatten( 1 )
    ] .to_json

  end

  get "/instances/jsonp" do

    "jsonCallback( " + Hash[ *
      VWF::Application::Reflector.instances( env ).map do |resource, instance|
        [ resource, Hash[ :clients => Hash[ * instance[:clients].map { |client| [ client.id, nil ] } .flatten( 1 ) ] ] ]
      end .flatten( 1 )
    ] .to_json + " )"

  end

  get "/models" do
    directory = Rack::Directory.new('public')
    directory._call({'SCRIPT_NAME'=>request.scheme+'://'+request.host_with_port, 'PATH_INFO'=>'models'})
    dirContents = directory.list_directory[2].files
    dirContents.map do |dirContent|
      if dirContent[3] != "" && dirContent[3] != "directory"
        Hash[ "url"=>dirContent[0].gsub(/http%3A\//, 'http%3A//'), "basename"=>dirContent[1], "size"=>dirContent[2], "type"=>dirContent[3], "mtime"=>dirContent[4] ]
      end
    end .compact .to_json
  end

  get "/files" do
    directory = Rack::Directory.new('public')
    directory._call({'SCRIPT_NAME'=>request.scheme+'://'+request.host_with_port, 'PATH_INFO'=>request.env["vwf.root"]})
    dirContents = directory.list_directory[2].files 
    dirContents.map do |dirContent|
      if dirContent[3] == "application/json"
        Hash[ "url"=>dirContent[0].gsub(/http%3A\//, 'http%3A//'), "basename"=>dirContent[1], "size"=>dirContent[2], "type"=>dirContent[3], "mtime"=>dirContent[4] ]
      end
    end .compact .to_json
  end

  get "/config" do
    if(File.exists?("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.config.yaml"))
      config = File.read("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.config.yaml")
      config = YAML.load(config)
      config.to_json
    elsif(File.exists?("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.config.json"))
      config = File.read("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.config.json")
      config = JSON.load(config)
      config.to_json
    end
  end

  # The application's "chrome" HTML overlay.
  # 
  # For an application `application.vwf`, the chrome is in the file `application.vwf.html`. An empty
  # document is sent if the overlay file doesn't exist.

  get "/chrome" do

    chrome_file = File.join VWF.settings.public_folder, env["vwf.root"],
      "#{ env["vwf.application"] }.html"

    if File.exists? chrome_file
      send_file chrome_file
    else
      content_type :html
      ""
    end

  end

end
