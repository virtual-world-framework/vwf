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

    # Start the timer on the first connection to this instance.

    schedule_tick

    # Use a consistent timestamp for the synchronization messages.

    time = session[:transport].time

    # Register as a not-yet-synchronized client.

    session[:pending_clients] ||= {}
    session[:pending_clients][self] = [ time ] # save the client's starting time

    # Initialize the first client to the instance, or synchronize an additional client to the first.

    unless clients.length > session[:pending_clients].size

      # Initialize to the application starting state.

      fields_createNode = {
        "time" => time,
        "action" => "createNode",
        "parameters" => [ env["vwf.application"] ]
      }

      send fields_createNode

      session[:pending_clients].delete self

    else

      # Request the current state from a synchronized client.  # TODO: find first non-pending client in list

      # clients.first.send "time" => time, "action" => "hashState", "respond" => true

      fields_getState = {
        "time" => time,
        "action" => "getState",
        "respond" => true
      }

      clients.first.send fields_getState

      # clients.first.send "time" => time, "action" => "hashState", "respond" => true
      # clients.first.send "time" => time, "action" => "getState", "parameters" => [ true, true ], "respond" => true

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

      log fields, :receive

      # When the request for the current state is received, update all unsynchronized clients to the
      # current state. Refresh the synchronized clients as well since the get/set operation may be
      # lossy, and this ensures that every client resumes from the same state.

      if fields["action"] == "getState"

        fields_setState = {
          "time" => nil, # updated per client
          "action" => "setState",
          "parameters" => [ fields["result"] ]
        }

        session[:pending_clients].each do |client, messages| # clients.each do |client|

          time = messages.shift # the first slot stores the client's starting time

          # Set the state in the new client.

          client.send fields_setState.merge "time" => time

          # client.send "time" => time, "action" => "hashState", "respond" => true
          # client.send "time" => time, "action" => "getState", "parameters" => [ true, true ], "respond" => true

          # Deliver any messages that arrived after the client joined but before we received the
          # state from the reference client.

          messages.each do |fields_pending|
            client.send fields_pending.merge "time" => time
          end

        end

        session[:pending_clients].clear

      end

    end

  end
  
  def ondisconnect

    # Unregister from the not-yet-synchronized list if we're still there.

    session[:pending_clients].delete self
    # TODO: resend getNode if this was the reference client and a getNode was pending

    # Stop the timer and clear the state on the last disconnection from this instance.

    cancel_tick

    super

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

      logger.debug "VWF::Application::Reflector#broadcast #{ object_id } #{ message_for_log message }" if log

      clients.each do |client|
        unless session[:pending_clients][client] # established clients: same as in super
          next if client.closing
          client.log fields, :send if log
          client.send message, false
        else # pending clients: save until "setState" sent
          session[:pending_clients][client].push fields
        end
      end

    else # otherwise the socket.io default
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

    if clients.length == 1
      transport = session[:transport] = Transport.new
      session[:timer] = EventMachine::PeriodicTimer.new( 0.0333333333 ) do  # TODO: configuration parameter for update rate
        transport.playing and broadcast( { "time" => transport.time }, false )
      end
      transport.play  # TODO: wait until first client has completed loading  # TODO: wait until all clients are ready for an instructor session
    end

  end
  
  def cancel_tick

    if clients.length == 1
      session[:timer].cancel
      session.delete :timer
      session[:transport].stop
      session.delete :transport
    end
    
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
