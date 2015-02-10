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

  # Configuration options.

  SPAWN_INSTANCES = true                # create new instances on application and revision references
  SPAWN_ADHOC_INSTANCES = false         # create unknown instances when referenced
  SPAWN_ADHOC_REVISIONS = true          # create temporary revisions when referenced
  SPAWN_ADHOC_TAGS = true               # create unknown tags when referenced

  # Top-level routes. Instance and revision tags won't match these names.

  KEYWORDS = [
    "instances",
    "instance",
    "revisions",
    "revision",
    "tags",
    "tag",
    "reflector",
    "client"
  ]

  # Types supported by the API resources, in order of preference.

  API_TYPES = [
    "application/json",
    "text/yaml",
    "text/html"
  ]

  configure do

    # Condition to detect interactive requests from a user at a browser, as opposed to API requests.

    set :interactive do |wants_interactive|
      condition do
        is_interactive = !! interactive?
        wants_interactive == is_interactive
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

  # Verify that the application exists in storage and record its storage object. Record an explicit
  # type if one is provided, and remove it from the URL.

  before ".:format" do |format|
    @type = deformat format
  end

  before "/?*" do |_|
    if @storage = VWF.storage[ request.script_name ]
      @script_name = request.script_name
    else
      halt 404
    end
  end

  # If the request is for an instance, verify that the instance exists in storage and record its
  # storage object. Record an explicit type if one is provided, and remove it from the URL. Remove
  # the instance from the URL so that `/instance/abcd/resource` becomes `/resource`.

  before "/instance/:id.:format" do |_, format|
    @type = deformat format
  end

  before "/instance/:id/?*" do |id, _|
    if @storage = storage_instance( @storage, id, interactive? && SPAWN_ADHOC_INSTANCES )
      @tag = nil
      route_as "/instance/#{id}"
    else
      halt 404
    end
  end

  # Locate an instance by tag. An instance `abcd` tagged `tag` may be referenced as `/instance/abcd`
  # or `/tag`. Remove the tag from the URL so that `/tag/resource` becomes `/resource`.

  before "/:tag.:format" do |_, format|
    @type = deformat format
  end

  before "/:tag/?*" do |tag, _|
    if storage = storage_instance_tagged( @storage, tag )
      @storage = storage
      @tag = tag
      route_as "/#{tag}"
    end
  end

  # If the request is for a revision, verify that the revision exists in storage and record its
  # storage object. Record an explicit type if one is provided, and remove it from the URL. Remove
  # the revision from the URL so that `/revision/123/resource` becomes `/resource`.

  before "/revision/:id.:format" do |_, format|
    @type = deformat format
  end

  before "/revision/:id/?*" do |id, _|
    if @storage = storage_revision( @storage, id, ( interactive? || @type == "text/html" ) && SPAWN_ADHOC_REVISIONS )
      @tag = nil
      route_as "/revision/#{id}"
    else
      halt 404
    end
  end

  # Locate a revision by tag. A revision `123` tagged `tag` may be referenced as `/revision/123` or
  # `/tag`. Remove the tag from the URL so that `/tag/resource` becomes `/resource`.

  before "/:tag.:format" do |_, format|
    @type = deformat format
  end

  before "/:tag/?*" do |tag, _|
    if storage = storage_revision_tagged( @storage, tag )
      @storage = storage
      @tag = tag
      route_as "/#{tag}"
    end
  end

  # Detect and remove the type for the remaining resources that accept an explicit type.

  before "/instances.:format" do |format|
    @type = deformat format
  end

  before "/revisions.:format" do |format|
    @type = deformat format
  end

  before "/tags.:format" do |format|
    @type = deformat format
  end

  before "/tag/:tag_id.:format" do |_, format|
    @type = deformat format
  end

  # At this point, `@storage` refers to the existing application, instance, or revision identified
  # in the original URL, `@tag` is the tag alias used, if any, and `@type` is an explictly-requested
  # result type. The URL isn't changed by any of the remaining rules.

  # For interactive requests, redirect singular resources to directory resources. Non-interactive
  # requests are handled as application, instance, or revision state requests below.

  get "", :interactive => true do
    redirect to "/"
  end

  # For interactive requests, redirect an application to a new instance of the application or a
  # revision to new instance copied from the revision.

  get "/", :interactive => true do

    # Instances have revisions. For others, if we're spawning new copies, locate the first ancestor
    # that can contain instances. For revisions, this will be the containing application. For
    # applications, this will be the application itself.

    unless @storage.respond_to?( :revisions ) || ! SPAWN_INSTANCES
      spawner = @storage
      spawner = spawner.collection.container until spawner.respond_to?( :instances ) || ! spawner
    end

    # If we're spawning and there's a spawn source, duplicate the current resource into a new
    # instance and redirect to it. Otherwise, launch the client at the current resource.

    if spawner
      instance = spawner.instances.create( @storage.state )
      unroute_as ; redirect to "/instance/#{instance.id}/"
    else
      Client.new.call env
    end

  end

  # Serve the reflector.

  get "/reflector/?*" do
    route_as "/reflector"
    randomize_resource = ! @storage.respond_to?( :revisions )
    Reflector.new( @storage, randomize_resource ).call env
  end

  # Serve the client files.

  get "/client/?*" do
    route_as "/client"
    Client.new.call env
  end

  # Application, instance, or revision state.

  get "" do
    generate @storage.class.name.split( "::" ).last.downcase.to_sym do
      @storage.respond_to?( :instances ) ? @storage.get : @storage.state
    end
  end

  # Application instances.

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

  # Instance revisions.

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

  # Application, instance, or revision tags.

  get "/tags" do
    generate :tags do
      @storage.tags.each.map do |id, tag|
        Hash[ tag.id => ( to tag_url tag.id ) ]
      end
    end
  end

  # Application, instance, or revision tag.

  get "/tag/:id" do |id|
    if tag = @storage.tags[ id ]
      generate :tag, tag.get, :tag => tag
    elsif interactive?
      @storage.set( {} ) unless @storage.get  # reify ad hoc revisions
      @storage.tags.create( id, {} )
      redirect to "../../#{id}"
    else
      halt 404
    end
  end

  helpers do

    # Is this an interactive request from a user at a browser, not an API request?

    # Interactive requests for applications, instances, or revisions should bootstrap the client,
    # and singular resources should redirect to directory resources. An explicit type suppresses the
    # interactive magic.

    def interactive?
      request.accept.include?( "text/html" ) && ! @type  # `accept.include?`, not `accept?`; want explict `text/html`
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

    # Get an instance identified by a tag from a `VWF::Storage` item. Return `nil` if `item` doesn't
    # contain instances or if none of the instances have the tag `tag`.

    def storage_instance_tagged item, tag
      if item.respond_to?( :instances ) && ! KEYWORDS.include?( tag )
        item.instances.each.find do |id, instance|
          break instance if instance.tags[ tag ]
        end
      end
    end

    # Get a revision identified by a tag from a `VWF::Storage` item. Return `nil` if `item` doesn't
    # contain revisions or if none of the revisions have the tag `tag`.

    def storage_revision_tagged item, tag
      if item.respond_to?( :revisions ) && ! KEYWORDS.include?( tag )
        item.revisions.each.find do |id, revision|
          break revision if revision.tags[ tag ]
        end
      end
    end

    # Remove `.foramt` from `path_info` and return record the corresponding media type.

    def deformat format
      if type = Rack::Mime.mime_type( ".#{format}" ) and API_TYPES.include?( type )
        request.path_info = request.path_info[ 0, request.path_info.length - ".#{format}".length ]
        type
      end
    end

    # Move `migrating_segments` to `request.script_name` from `request.path_info` so that additional
    # routing for `/script/name` + `/mezzo/resource/path/info` will be done as
    # `/script/name/mezzo/resource` + `/path/info`.

    def route_as migrating_segments
      if request.path_info.start_with? migrating_segments
        request.script_name += migrating_segments
        request.path_info = request.path_info[ migrating_segments.length, request.path_info.length - migrating_segments.length ]
      end
    end

    # Undo the effects of `route_as`.

    def unroute_as
      request.script_name = @script_name
    end

    # Generate a JSON or YAML result, or render a template to HTML.

    def generate template, value = nil, locals = nil
      case @type || request.preferred_type( API_TYPES )
        when "application/json"
          content_type :json
          ( value || yield ).to_json
        when "text/yaml"
          content_type :yaml
          ( value || yield ).to_yaml
        when "text/html"
          slim template, :locals => locals
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

    def tags_url format = nil
      "/tags#{extension format}"
    end

    def tag_url tag, format = nil
      "/tag/#{tag}#{extension format}"
    end

    def extension format = nil
      format ? ".#{format}" : ""
    end

    # For a storage item with revisions (an instance), iterate over blocks of states + actions. The
    # block will be called for each state and will be provided a block that may be called to receive
    # actions that follow the state.

    # For an item with the following revisions:
    # 
    #           R   R   R
    #   S A A A A A S A A A
    #   2 3 4 5 6 7 8 9 a b
    # 
    # `revisions_by_states_actions` works as follows:
    # 
    #   revisions_by_states_actions do |state, tags, &block|
    #     # Called with revision `8` and `2` states and tags.
    #     block.call do |action, tags|
    #       # For `8`, called with revision `9`, `a`, and `b` actions and tags.
    #       # For `2`, called with revision `3`, `4`, .. `7` actions and tags.
    #     end
    #   end

    def revisions_by_states_actions &block

      revisions = @storage.revisions.each.to_h

      next_state_id = nil

      @storage.states.reverse_each do |state_id, state|

        revision = revisions[ state_id ]
        tags = revision && revision.tags

        block.call state, tags do |&block|

          @storage.actions.each( state_id, next_state_id ) do |action_id, action|

            revision = revisions[ action_id ]
            tags = revision && revision.tags

            block.call action, tags unless action_id == state_id || action_id == next_state_id

          end

        end

        next_state_id = state_id

      end

    end

  end

end
