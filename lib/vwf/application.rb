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

class VWF::Application < Sinatra::Base

  require_relative "application/client"

  SPAWN_INSTANCES = true                # create new instances on application references
  SPAWN_ADHOC_INSTANCES = false         # create unknown instances when referenced
  SPAWN_ADHOC_REVISIONS = true          # create temporary revisions when referenced

  ## Types supported by the API resources, in order of preference.

  @@api_types = [
    "application/json",
    "text/yaml",
    "text/html"
  ]

  configure do

    # Condition to detect browser requests, as opposed to XHR requests. Browser requests for
    # application resources should bootstrap the client, and singular application resources should
    # redirect to directory resources.

    set :browser do |wants_browser|
      condition do
        is_browser = !! browser?
        wants_browser == is_browser
      end
    end

  end

  configure :production do

    enable :logging

  end

  configure :development do

    register Sinatra::Reloader

    require "logger"
    set :logging, ::Logger::DEBUG

  end

  ### Detect and remove `.:format`. ################################################################

  before ".:format" do |format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instances.:format" do |format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id.:format" do |_, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id/revisions.:format" do |_, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id/revision/:revision_id.:format" do |_, _, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  ### Validate the application, instance, and revision. ############################################

  before "/?*" do
    if @storage = VWF.storage[ request.script_name ]
      @script_name = request.script_name
    else
      halt 404
    end
  end

  before "/instance/:id/?*" do |id, _|
    if @storage = storage_instance( @storage, id, browser? && SPAWN_ADHOC_INSTANCES )
      route_as "/instance/#{id}"
    else
      halt 404
    end
  end

  before "/revision/:id/?*" do |id, _|
    if @storage = storage_revision( @storage, id, browser? && SPAWN_ADHOC_REVISIONS )
      route_as "/revision/#{id}"
    else
      halt 404
    end
  end

  ### Redirect singular resources to directory resources. ##########################################

  get "", :browser => true do
    pass if @type
    redirect to "#{request.path_info}/"
  end

  # Redirect the application to a new instance. ####################################################

  get "/", :browser => true do

    unless @storage.respond_to?( :revisions ) || ! SPAWN_INSTANCES
      spawner = @storage
      spawner = spawner.collection.container until spawner.respond_to?( :instances ) || ! spawner
    end

    if spawner
      instance = spawner.instances.create( @storage.state )
      unroute_as ; redirect to "/instance/#{instance.id}/"
    else
      Client.new.call env
    end

  end

  ### Serve the reflector ##########################################################################

  get "/reflector/?*" do
    route_as "/reflector"
    randomize_resource = ! @storage.respond_to?( :revisions )
    Reflector.new( @storage, randomize_resource ).call env
  end

  ### Serve the client files. ######################################################################

  get "/client/?*" do
    route_as "/client"
    Client.new.call env
  end

  # Application state. #############################################################################

  get "" do
    generate @storage.class.name.split( "::" ).last.downcase.to_sym do
      @storage.respond_to?( :instances ) ? @storage.get : @storage.state
    end
  end

  get "/instances" do
    if @storage.respond_to? :instances
      generate :instances do
        @storage.instances.each.map do |id, instance|
          Hash[ instance.id => ( to instance_url instance.id ) ]
        end
      end
    else
      halt 404
    end
  end

  get "/revisions" do
    if @storage.respond_to? :revisions
      generate :revisions do
        @storage.revisions.each.map do |id, revision|
          Hash[ revision.id => ( to revision_url revision.id ) ]
        end
      end
    else
      halt 404
    end
  end

  helpers do

    # Is this request from a browser--an interactive sesssion, not an API request?

    def browser?
      request.accept.include?( "text/html" )  # `accept.include?`, not `accept?`; want explict `text/html`
    end

    # Get an instance from a `VWF::Storage` item. With `spawn`, create a new instance if the
    # identified instance doesn't exist. New instances are initialized with the current `item` state.
    # Return `nil` if `item` doesn't contain instances or if the instance wasn't found or created.

    def storage_instance item, id, spawn = false
      if item.respond_to? :instances
        result = item.instances[ id ]
        result = item.instances.create( id, item.state ) if ! result && spawn
        result
      end
    end

    # Get a revision from a `VWF::Storage` item. If the identified revision doesn't exist but a state
    # or actions do, and if `spawn` is set, create a new, temporary revision. New revisions are not
    # saved to storage, but they may be used to retrive the state at that point. Return `nil` if
    # `item` doesn't contain revisions or if the revision wasn't found or created.

    def storage_revision item, id, spawn = false
      if item.respond_to? :revisions
        result = item.revisions[ id ]
        result = item.revisions.create( id, nil ) if ! result && spawn && ( item.states[ id ] || item.actions[ id ] )
        result
      end
    end

    def route_as migrating_segments
      if request.path_info.start_with? migrating_segments
        request.script_name += migrating_segments
        request.path_info = request.path_info[ migrating_segments.length .. -1 ]
      end
    end

    def unroute_as
      request.script_name = @script_name
    end

    # Generate a JSON or YAML result, or render a template to HTML.

    def generate template
      case @type || request.preferred_type( @@api_types )
        when "application/json"
          content_type :json
          yield.to_json
        when "text/yaml"
          content_type :yaml
          yield.to_yaml
        when "text/html"
          slim template
      end
    end

    def application_url format = nil
      "#{extension format}"
    end

    def instances_url format = nil
      "/instances#{extension format}"
    end

    def instance_url id, format = nil
      "/instance/#{id}#{extension format}"
    end

    def revisions_url format = nil
      "/revisions#{extension format}"
    end

    def revision_url id, format = nil
      "/revision/#{id}#{extension format}"
    end

    def extension format = nil
      format ? ".#{format}" : ""
    end

  end

end
