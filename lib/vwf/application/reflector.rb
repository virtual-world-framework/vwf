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
require "vwf/storage"
require "vwf/application/persistence"
require "json"
require "time"

class VWF::Application::Reflector < Rack::SocketIO::Application

  @@storage = VWF::Storage.new()
      
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

    # The first client to join the instance.

    if clients.length == 1 # coming from 0
    
      # Check if persistence is enabled for this application
      if VWF::Application::Persistence.enabledForApplication( env )
        # Mark this instance as having persistence enabled.
        VWF::Application::Reflector.instance_enable_persistence( env, true )
        # Atempt to load the persistence state for this particular instance.
        persistence_state = @@storage.get_persistence_state( env[ "vwf.root" ], env[ "vwf.application" ], env[ "vwf.instance" ] )
        unless persistence_state.nil?
          VWF::Application::Reflector.set_instance_persistence_state( env, persistence_state )
        end        
      end


      # Initialize the client configuration from the runtime environment.

      logger.debug "VWF::Application::Reflector#connect #{id} " +
          "launching from #{ env["vwf.application"] }"
      
      if env["vwf.load"]
        filename = VWF.settings.public_folder+"/../documents#{ env['vwf.root'] }/#{ env['vwf.load'] }/saveState.vwf.json"
        if env["vwf.loadrevision"]
          if File.exists?(VWF.settings.public_folder+"/../documents#{ env['vwf.root'] }/#{ env['vwf.load'] }/saveState_"+env["vwf.loadrevision"]+".vwf.json")
            filename = VWF.settings.public_folder+"/../documents#{ env['vwf.root'] }/#{ env['vwf.load'] }/saveState_"+env["vwf.loadrevision"]+".vwf.json"
          end
        end
      end

      # TODO: check for file format not that json exists
      if  env["vwf.load"] and File.exists?(filename)
        contents = File.read(filename)
        json = JSON.parse("#{ contents }", :max_nesting => 100)
        startTime = 0
        startTime = json["queue"]["time"] unless json["queue"].nil?

        # Start the timer on the first connection to this instance.

        schedule_tick( startTime )
        send "time" => session[:transport].time,
          "action" => "setState",
          "parameters" => [
              json
            ]

        # FAKEAUTHORITATIVESTATE
        # Setup the fake authoritative state, setting the state itself to the
        # loaded save state, the timestampe for when it was received to now,
        # and noting that no state request has been made.        
        session[ :authoritative_state ] = json
        session[ :authoritative_state_timestamp ] = Time.now
        session[ :authoritative_state_request_pending ] = false
        # END OF FAKEAUTHORITATIVESTATE
      elsif( File.exists?("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.json"))

        contents = File.read("public#{ env["vwf.root"] }/#{ env["vwf.application"] }.json")
        json = JSON.parse("#{ contents }", :max_nesting => 100)
        startTime = 0
        startTime = json["queue"]["time"] unless json["queue"].nil?
        
        # Start the timer on the first connection to this instance.
        
        
        schedule_tick( startTime )
        send "time" => session[:transport].time,
          "action" => "setState",
          "parameters" => [
              json
            ]
            
        # FAKEAUTHORITATIVESTATE
        # Setup the fake authoritative state, setting the state itself to the
        # loaded save state, the timestampe for when it was received to now,
        # and noting that no state request has been made.
        session[ :authoritative_state ] = json
        session[ :authoritative_state_timestamp ] = Time.now
        session[ :authoritative_state_request_pending ] = false
        # END OF FAKEAUTHORITATIVESTATE
      elsif ( ! VWF::Application::Reflector.instance_persistence_state( env ).nil? )
        # A persistence state was loaded for this instance, and this is the first client,
        # so use the persistence state for the initial setState, and start at the time
        # stored in the persistence state.
        peristence_state = VWF::Application::Reflector.instance_persistence_state( env )
        
        startTime = 0
        startTime = persistence_state[ "queue" ][ "time" ] unless persistence_state[ "queue" ].nil?

        schedule_tick( startTime )
        send "time" => session[:transport].time,
          "action" => "setState",
          "parameters" => [
              persistence_state
            ]

        # FAKEAUTHORITATIVESTATE
        # Setup the fake authoritative state, setting the state itself to the
        # loaded persistence state, the timestampe for when it was received to now,
        # and noting that no state request has been made.
        session[ :authoritative_state ] = json
        session[ :authoritative_state_timestamp ] = Time.now
        session[ :authoritative_state_request_pending ] = false
        # END OF FAKEAUTHORITATIVESTATE
      else
      
        # Start the timer on the first connection to this instance.
        schedule_tick(0)

        send "time" => session[:transport].time,
          "action" => "setState",
          "parameters" => [ {
            "configuration" =>
              { "environment" => ENV['RACK_ENV'] || "development" }
          } ]

        send "time" => session[:transport].time,
          "action" => "createNode",
          "parameters" => [
            "http://vwf.example.com/clients.vwf"
          ]

        send "time" => session[:transport].time,
          "action" => "createNode",
          "parameters" => [
            env["vwf.application"],
            "application"
          ]

        # FAKEAUTHORITATIVESTATE
        # Setup the fake authoritative state, setting the state itself to nil,
        # the timestamp for when it was received to nil,
        # and noting that no state request has been made.
        session[ :authoritative_state ] = nil
        session[ :authoritative_state_timestamp ] = nil
        session[ :authoritative_state_request_pending ] = false
        # END OF FAKEAUTHORITATIVESTATE
      end

    # The second client to join the instance, or the next client to join after earlier clients have
    # fully connected.

    elsif session[:pending].nil?

      # Create space to store clients waiting for replication and any messages that we receive
      # before they are fully connected.

      logger.debug "VWF::Application::Reflector#connect #{id} " +
          "connecting and suspending (1 suspended)"

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

      logger.debug "VWF::Application::Reflector#connect #{id} " +
          "requesting state from #{source.id}"

      source.send "time" => time,
        "action" => "getState",
        "respond" => true

    # Additional clients that join the instance when at least one earlier client is waiting for
    # replication.

    else

      # Save this client with the others waiting for replication.

      logger.debug "VWF::Application::Reflector#connect #{id} " +
          "connecting and suspending (#{ session[:pending][:clients].length + 1 } suspended)"

      session[:pending][:clients].push self

    end

    # Create a child in the application's `clients.vwf` global to represent this client.

    broadcast "time" => session[:transport].time,
      "action" => "createChild",
      "parameters" => [ "http-vwf-example-com-clients-vwf", id, {} ]

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

  def receive fields

    log fields, :receive

    # FAKEAUTHORITATIVESTATE
    # First, test if this is a response to a getState action...
    # This function only fires for responses with a fields[ "result" ], so if this
    # is a getState action, then this must be the current state of the instance.
    # Store the authoritative_state, set the authoritative_state_timestamp to the current time
    # and set the request_pending flag to false.
    if fields[ "action" ] == "getState"
      session[ :authoritative_state ] = fields[ "result" ]
      session[ :authoritative_state_timestamp ] = Time.now
      session[ :authoritative_state_request_pending ] = false
    end
    # END OF FAKEAUTHORITATIVESTATE

    # When the request for the current state is received, update all unsynchronized clients to the
    # current state. Refresh the synchronized clients as well since the get/set operation may be
    # lossy, and this ensures that every client resumes from the same state.

    if fields["action"] == "getState" && session[:pending] && session[:pending][:source] == self

      logger.debug "VWF::Application::Reflector#receive #{id} received state"

      fields_setState = {
        "time" => session[:pending][:time],
        "action" => "setState",
        "parameters" => [ fields["result"] ]
      }

      # Send the setState message to each of the new clients

      session[:pending][:clients].each do |client|

        # Set the state in the new client.

        logger.debug "VWF::Application::Reflector#receive #{id} " +
          "setting state in #{client.id}"

        client.send fields_setState

        # Deliver any messages that arrived after the client joined but before we received the
        # state from the reference client.

        session[:pending][:messages].each do |fields_pending|
          client.send fields_pending
        end

        # client.send "time" => time, "action" => "hashState", "respond" => true
        # client.send "time" => time, "action" => "getState", "parameters" => [ true, true ], "respond" => true

      end

      session[:pending][:clients].each do |client|
        logger.debug "VWF::Application::Reflector#receive #{id} " +
          "resuming #{client.id} (#{ session[:pending][:clients].length } suspended)"
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

    # Delete the child representing this client in the application's `clients.vwf` global.

    broadcast "time" => session[:transport].time,
      "action" => "deleteChild",
      "parameters" => [ "http-vwf-example-com-clients-vwf", id ]

    # Just log the disconnection if no clients are waiting for replication.

    if ! session[:pending]

      logger.debug "VWF::Application::Reflector#disconnect #{id} " +
          "disconnecting"

    # If the disconnecting client was waiting for replication, remove it from the `pending` list.
    # Completely remove the `pending` object if no other clients are waiting.

    elsif session[:pending][:clients].include? self

      logger.debug "VWF::Application::Reflector#disconnect #{id} " +
        "disconnecting (suspended) (#{ session[:pending][:clients].length } suspended)"

      session[:pending][:clients].delete self
      session.delete :pending if session[:pending][:clients].empty?

    # If the disconnecting client was the replication source for other clients waiting for
    # replication, put the pending clients aside so that we can replay their connections and choose
    # a new source.

    elsif session[:pending][:source] == self

      logger.debug "VWF::Application::Reflector#disconnect #{id} " +
        "disconnecting (source) (#{ session[:pending][:clients].length } suspended)"

      session[:stasis] = session[:pending][:clients]
      session.delete :pending

    # Otherwise, just log the disconnection.

    else

      logger.debug "VWF::Application::Reflector#disconnect #{id} " +
        "disconnecting (#{ session[:pending][:clients].length } suspended)"

    end

    # Stop the timer after the last disconnection from this instance.
    # If persistence was enabled for this instance, and there is an authoritative state
    # then save the current authoritative state.

    if clients.length == 1 # going to 0
      if VWF::Application::Reflector.instance_is_persistence_enabled?( env ) and ! session[ :authoritative_state ].nil?
        @@storage.set_persistence_state( env[ "vwf.root" ], env[ "vwf.application" ], env[ "vwf.instance" ], session[ :authoritative_state ], nil )
      end
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

      logger.debug "VWF::Application::Reflector#broadcast #{id} " +
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

  def schedule_tick( initial_time )

    logger.debug "VWF::Application::Reflector#schedule_tick #{id}"

    transport = session[:transport] = Transport.new

    session[:timer] = EventMachine::PeriodicTimer.new( 0.05 ) do  # TODO: configuration parameter for update rate
      transport.playing and broadcast( { "time" => transport.time }, false )
      # FAKEAUTHORITATIVESTATE
      # If we do not have a timestamp, or the authortitative state timestamp is more than 30 seconds old, and we have not previously made a request for an
      # authoritative state update as denoted by the authoritative_state_request_pending flag, then send a getState message and mark that we have made
      # a request.
      if ( session[ :authoritative_state_timestamp ].nil? or ( Time.now - session[ :authoritative_state_timestamp ]  > 10.0 ) ) and session[ :authoritative_state_request_pending ] == false
        clients.first.send "time" => session[:transport].time,
          "action" => "getState",
          "respond" => true
        session[ :authoritative_state_request_pending ] = true
      end
      # END OF FAKEAUTHORITATIVESTATE
    end

    transport.time = initial_time
 
  end
  
  def cancel_tick

    logger.debug "VWF::Application::Reflector#cancel_tick #{id}"

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
