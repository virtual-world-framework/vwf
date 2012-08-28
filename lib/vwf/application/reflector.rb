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

    # first

    if clients.length == 1 # coming from 0

      # Start the timer on the first connection to this instance.

      schedule_tick

      # Initialize the client configuration from the runtime environment.

      logger.debug "VWF::Application::Reflector#connect #{ object_id } " +
          "launching #{id} from #{ env["vwf.application"] }"

      send "time" => session[:transport].time,
        "action" => "setState",
        "parameters" => [ {
          "configuration" =>
            { "environment" => ENV['RACK_ENV'] || "development" },
          "nodes" =>
            [ env["vwf.application"] ]
        } ]

    # second

    elsif session[:pending].nil?

      # xxx

      logger.debug "VWF::Application::Reflector#connect #{ object_id } " +
          "connecting #{id} and suspending (1 suspended)"

      session[:pending] = {
        :time => session[:transport].time,
        :source => clients.reject { |client| client == self } .first,
        :clients => [ self ],
        :messages => []
      }

      # Request the current state from a synchronized client.

      source = session[:pending][:source]
      time = session[:pending][:time]

      # source.send "time" => time, "action" => "hashState", "respond" => true

      logger.debug "VWF::Application::Reflector#connect #{ object_id } " +
          "requesting state from #{source.id}"

      source.send "time" => time,
        "action" => "getState",
        "respond" => true

    # pending

    else

      logger.debug "VWF::Application::Reflector#connect #{ object_id } " +
          "connecting #{id} and suspending (#{ session[:pending][:clients].length + 1 } suspended)"

      session[:pending][:clients].push self

    end

  end

  def onmessage message

    super

    fields = JSON.parse message, :max_nesting => 100

    # For a normal message, stamp it with the curent time and originating client, and send it to
    # each client.

    unless fields["result"]

      broadcast fields.merge "time" => session[:transport].time, "client" => id  # TODO: allow future times on incoming fields["time"] and queue until needed
        
    # Handle messages where the client returned a result to the server.

    else

      receive fields

    end

  end

  # xxx

  def receive fields

    log fields, :receive

    # When the request for the current state is received, update all unsynchronized clients to the
    # current state. Refresh the synchronized clients as well since the get/set operation may be
    # lossy, and this ensures that every client resumes from the same state.

    if fields["action"] == "getState" && session[:pending] && session[:pending][:source] == self

      logger.debug "VWF::Application::Reflector#receive #{ object_id } received state from #{id}"

      time = session[:pending][:time]

      fields_setState = {
        "time" => time,
        "action" => "setState",
        "parameters" => [ fields["result"] ]
      }

      while client = session[:pending][:clients].shift
        logger.debug "VWF::Application::Reflector#receive #{ object_id } " +
          "resuming #{client.id} (#{ session[:pending][:clients].length } suspended)"
      end

      clients.each do |client|

        # Set the state in the new client.

        logger.debug "VWF::Application::Reflector#receive #{ object_id } " +
          "setting state in #{client.id}"

        client.send fields_setState

        # Deliver any messages that arrived after the client joined but before we received the
        # state from the reference client.

        session[:pending][:messages].each do |fields_pending|
          client.send fields_pending.merge "time" => time
        end

        # client.send "time" => time, "action" => "hashState", "respond" => true
        # client.send "time" => time, "action" => "getState", "parameters" => [ true, true ], "respond" => true

      end

      session.delete :pending

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

    if session[:pending]

      if session[:pending][:clients].include? self

        logger.debug "VWF::Application::Reflector#disconnect #{ object_id } " +
          "disconnecting #{id}+ (#{ session[:pending][:clients].length } suspended)"

        session[:pending][:clients].delete self
        session.delete :pending if session[:pending][:clients].empty?

      elsif session[:pending][:source] == self

        logger.debug "VWF::Application::Reflector#disconnect #{ object_id } " +
          "disconnecting #{id}* (#{ session[:pending][:clients].length } suspended)"

        # The disconnecting client was to provide state data for pending clients. Put the pending
        # clients aside so that we can replay their connections and choose a new source.

        session[:stasis] = session[:pending][:clients]
        session.delete :pending

      else

        logger.debug "VWF::Application::Reflector#disconnect #{ object_id } " +
          "disconnecting #{id} (#{ session[:pending][:clients].length } suspended)"

      end

    else

      logger.debug "VWF::Application::Reflector#disconnect #{ object_id } " +
          "disconnecting #{id}"

    end

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

  def broadcast message, log = true

    if Hash === message # magic when passed a fields Hash

      fields = message
      message = JSON.generate fields, :max_nesting => 100

      logger.debug "VWF::Application::Reflector#broadcast #{ object_id } " +
          "#{ message_for_log message }" if log

      clients.each do |client| # established clients: same as in super
        next if client.closing
        client.log fields, :send if log
        client.send message, false
      end

      if session[:pending] # pending clients: save until "setState" sent
        session[:pending][:messages].push fields
      end

    else # otherwise do the socket.io default

      super

    end

  end

  # Detailed log of a fields Hash.

  def log fields, direction

    if false  # TODO: provide a configuration option; this is a heavy operation and we only want to use it for trace-level debugging

      # Log to a directory under "log/" matching the application's location in "public/" plus
      # application/instance/client. Log messages for each unique time to a separate file.

      path = File.join "log", env["vwf.root"][1..100], env["vwf.application"], env["vwf.instance"], id

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

    logger.debug "VWF::Application::Reflector#schedule_tick #{ object_id } #{id}"

    transport = session[:transport] = Transport.new

    session[:timer] = EventMachine::PeriodicTimer.new( 0.05 ) do  # TODO: configuration parameter for update rate
      transport.playing and broadcast( { "time" => transport.time }, false )
    end

    transport.play  # TODO: wait until all clients are ready for an instructor session

  end
  
  def cancel_tick

    logger.debug "VWF::Application::Reflector#cancel_tick #{ object_id } #{id}"

    session[:timer].cancel
    session.delete :timer

    session[:transport].stop
    session.delete :transport
    
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
  
  class Transport

    def initialize
      @start_time = nil
      @pause_time = nil
      @rate = 1
    end

    def time= time
      # TODO: ?
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
      if playing && ! paused
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
