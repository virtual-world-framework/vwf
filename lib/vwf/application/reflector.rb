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

require "rack/socket-io/application"
require "json"

class VWF::Application::Reflector < Rack::SocketIO::Application

  def initialize resource, storage

    super resource

    @resource = resource  # vwf app resource: application+instance+revision; script_name =~ resource + "/reflector"
    @storage = storage

    session[ :something ] ||= SomethingAboutSharedInstanceState.new @storage  # TODO: rename session to instance

  end

  def call env
    if env["PATH_INFO"] =~ %r{^/(socket|websocket)(/|$)}  # TODO: configuration parameter for paths accepted; "websocket/session" is for socket.io
      super
    else
      [ 404, {}, [] ]
    end
  end

  def onconnect

    super

    connect

  end

  def connect

    if state = session[ :something ].state

      send \
        "sequence" => session[ :something ].sequence,  # TODO: note: autoincrements
        "time" => session[ :something ].time,
        "action" => "setState",
        "parameters" => [ state ]
    end

    if actions = session[ :something ].actions
      actions.each { |action| send action }
    end

    # The first client to join the instance.

    if clients.length == 1  # from 0 to 1
      schedule_tick  # start the timer on the first connection to this instance.
    end

    # Create a child in the application's `clients.vwf` global to represent this client.

    broadcast \
      "action" => "createChild",
      "parameters" => [ "http-vwf-example-com-clients-vwf", id, {} ]

  end

  def onmessage message

    super

    fields = JSON.parse message, :max_nesting => 100

    unless fields[ "result" ]
      # For a normal message, stamp it with the curent time and originating client, and send it to
      # each client.
      broadcast fields.merge "client" => id  # TODO: allow future times on incoming fields["time"] and queue until needed
    else
      # Handle messages where the client returned a result to the server.
      receive fields
    end

  end

  def receive fields

    log fields, :receive

    # When the request for the current state is received, update all unsynchronized clients to the
    # current state. Refresh the synchronized clients as well since the get/set operation may be
    # lossy, and this ensures that every client resumes from the same state.

    if fields[ "action" ] == "getState"
      logger.debug "VWF::Application::Reflector#receive #{id} received state"
      session[ :something ].state = fields[ "result" ]
    end

  end

  def ondisconnect

    disconnect

    super

    # If the disconnecting client was providing state data for pending clients, replay connections
    # from the pending clients and choose a new source.

    if session[:stasis]

      while client = session[:stasis].shift
        client.connect
      end

      session.delete :stasis

    end

  end

  def disconnect

    # Delete the child representing this client in the application's `clients.vwf` global.

    broadcast \
      "action" => "deleteChild",
      "parameters" => [ "http-vwf-example-com-clients-vwf", id ]

    logger.debug "VWF::Application::Reflector#disconnect #{id} " +
        "disconnecting"

    # Stop the timer after the last disconnection from this instance.

    if clients.length == 1 # going to 0
      cancel_tick
    end

  end

  # Override the socket.io #send to accept messages as a fields hash and to record a detailed log
  # when enabled.

  def send message, log = true

    if Hash === message # magic when passed a fields Hash

      fields = message
      message = JSON.generate fields, :max_nesting => 100

      log fields, :send if log
      super message, log

    else # otherwise the socket.io default
      super
    end

  end

  # Override the socket.io #broadcast to accept messages as a fields hash, record a detailed log for
  # each client when enabled, and to store messages for pending clients to be delivered once the
  # client is ready.

  def broadcast action, log = true

    if action[ "action" ]

      fields = Hash[
        "sequence" => session[ :something ].sequence,  # TODO: note: autoincrements
        "time" => session[ :something ].time
      ] .merge action

      session[ :something ].actionPush fields

    else

      fields = Hash[
        "time" => session[ :something ].time
      ] .merge action

    end

    message = JSON.generate fields, :max_nesting => 100

    logger.debug "VWF::Application::Reflector#broadcast #{id} " +
        "#{ message_for_log message }" if log

    clients.each do |client| # established clients: same as in super
      next if client.closing
      client.log fields, :send if log
      client.send message, false
    end

  end

  # Detailed log of a fields Hash.

  def log fields, direction

    if false  # TODO: provide a configuration option; this is a heavy operation and we only want to use it for trace-level debugging

      # Log to a directory under "log/" matching the application's location in "public/" plus
      # application/instance/client. Log messages for each unique time to a separate file.

      path = File.join "log", @resource, id

      FileUtils.mkpath path

      # Timestamp string for the file name and message summary.

      stamp = "%010.4f" % fields["time"]

      # Create or append to the file.

      File.open File.join( path, stamp ), "a" do |file|

        # Filter to summarize the "parameters" array.

        filter = Proc.new do |element|
          case element
            when Hash
              "{ /* pruned */ }"
            when Array
              "[ " + element.map do |e|
                filter.call e
              end .join( ", ") + " ]"
            else
              element.inspect
          end
        end

        # Summarize the message as a comment before the YAML document.

        file.puts [

          "#",

          direction == :send ?
            ">" : "<",

          stamp,

          fields["action"] || "undefined",
          fields["node"] || "undefined",
          fields["member"] || "undefined",

          fields["parameters"] ?
            filter.call( fields["parameters"] ): "undefined"

        ] .join( " " )

        # Write the entire message as a YAML document.

        file.puts YAML::dump fields
        file.puts ""

      end

    end

  end

  # Instances derived from the given resource, and clients connected to those instances.

  def self.instances env
    Hash[ *
      instance_sessions( env ).map do |resource, session|
        [ resource, Hash[ :clients => clients( resource ) ] ]
      end .flatten( 1 )
    ]
  end

  # Instances derived from the resource that this client connects to, and clients connected to those
  # instances.

  def instances
    Hash[ *
      instance_sessions.map do |resource, session|
        [ resource, Hash[ :clients => self.class.clients( resource ) ] ]
      end .flatten( 1 )
    ]
  end

private

  def schedule_tick

    logger.debug "VWF::Application::Reflector#schedule_tick #{id}"

    # transport = session[:transport] = Transport.new  TODO -- exists only when needed (also remove entire session)

    session[:timer] = EventMachine::PeriodicTimer.new( 0.05 ) do  # TODO: configuration parameter for update rate
      session[ :something ].transport.playing and broadcast( {}, false )
    end
 
  end
  
  def cancel_tick

    logger.debug "VWF::Application::Reflector#cancel_tick #{id}"

    session[:timer].cancel
    session.delete :timer

    session[ :something ].transport.stop
    # session.delete :transport  TODO -- exists only when needed (also remove entire session)
    
  end

  def self.clients env

    session = self.session env

    super - ( session[:pending] ? session[:pending][:clients] : [] ) -
      ( session[:stasis] || [] )

  end

  def clients

    super - ( session[:pending] ? session[:pending][:clients] : [] ) -
      ( session[:stasis] || [] )

  end

public

  class SomethingAboutSharedInstanceState

    def initialize storage

      @storage = storage
      @transport = Transport.new

      if action = actions.last
        @sequence = action[ "sequence" ]     || 0
        @transport.time = action[ "time" ] || state[ "queue" ][ "time" ]    || 0
      elsif state
        @sequence = state[ "queue" ][ "sequence" ]   || 0
        @transport.time = state[ "queue" ][ "time" ]    || 0 # TODO: don't calculate state twice
      else
        @sequence = 0
        @transport.time = 0
      end

    end

    # dasdasasdsd

    def state

      case @storage
        when VWF::Storage::Application
          state_from_component @storage.get
        when VWF::Storage::Instance
          @storage.get
        when VWF::Storage::Revision
          @storage.get
      end

    end

    # dasdasasdsd

    def state= state

      case @storage
        when VWF::Storage::Application
          # ? TODO
        when VWF::Storage::Instance
          @storage.set state
        when VWF::Storage::Revision
          # ? TODO
      end

    end

    # dasdasasdsd

    def actions

      @storage.respond_to?( :actions ) ?
        @storage.actions.map { |id, action| action.get } : []

    end

    # dasdasasdsd

    def actionPush action

      if @storage.respond_to?( :actions )
        @storage.actions.create( action[ "sequence" ].to_s, action )
      end

    end

    # dasdasasdsd

    def time
      @transport.time
    end

    # dasdasasdsd

    def time= time
      @transport.time = time
    end

    # dasdasasdsd

    def sequence
      @sequence += 1
    end


def transport
  @transport
end


# TODO: ["kernel"]["time"] doesn't (shouldn't) matter
# TODO: simplify state: remove existing kernel.time, move queue.{sequence.time} to kernel.{...}, move queue.queue[] to queue[]



# client uses default configuration, sequence = 0, time = 0; to set configuration? add clients.vwf? init seq + time t 0; next message should be 1, +dt


  private

    def state_from_component

      Hash[
        "configuration" =>
          { "environment" => ENV['RACK_ENV'] || "development" },
        "kernel" =>
          { "time" => 0 },
        "nodes" =>
          [ "http://vwf.example.com/clients.vwf", @storage.get ],
        "annotations" =>
          { "1" => "application" },
        "queue" =>
          { "sequence" => 0, "time" => 0 }
      ]

    end

  end
  
  class Transport

    def initialize
      @start_time = nil
      @pause_time = nil
      @rate = 1
    end

    def time= time
      @start_time = Time.now - time
      @pause_time = nil
      @rate = 1
    end

    def rate= rate
      if playing
        @start_time = Time.now - ( Time.now - @start_time ) * @rate / rate
      elsif paused
        @start_time = @pause_time - ( @pause_time - @start_time ) * @rate / rate
      end
      @rate = rate
    end

    def play
      if stopped
        @start_time = Time.now
        @pause_time = nil
      elsif paused
        @start_time += Time.now - @pause_time
        @pause_time = nil
      end
    end

    def pause
      if playing
        @pause_time = Time.now
      end
    end

    def stop
      if playing || paused
        @start_time = nil
        @pause_time = nil
      end
    end

    def time
      if playing
        ( Time.now - @start_time ) * rate
      elsif paused
        ( @pause_time - @start_time ) * rate
      elsif stopped
        0
      end
    end

    def rate
      @rate
    end

    def playing
      !! @start_time && ! @pause_time
    end
    
    def paused
      !! @start_time && !! @pause_time
    end
    
    def stopped
      ! @start_time
    end
    
    def state
      {
        :time => time,
        :rate => rate,
        :playing => playing,
        :paused => paused,
        :stopped => stopped
      }
    end

  end

end
