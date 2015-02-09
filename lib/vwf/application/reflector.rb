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

  def initialize storage, randomize_resource = false
    super randomize_resource
    @storage = storage
  end

  def onconnect

    super

    state = thing.storage.state
    time = state[ "kernel" ][ "time" ] || 0

    if clients.length == 1 || thing.uncapped_actions < 10  # TODO: storage.state has recent enough state, or starting new so take what's there

      send "time" => time, "action" => "setState", "parameters" => [ state ]  # TODO: ... actions too ...

      if clients.length == 1
        thing.transport.play state[ "queue" ][ "time" ] || time
      end

    else

      self.pending = true

      if pending_clients.length == 1

        really_request "action" => "getState" do |sequence, state|

          if sequence && state
$stderr.puts "onconnect #{id} ##{clients.length} received state #{ state }"
            thing.storage.states.create sequence.to_s, state  # ... assumes storage.respond_to? :states, which must if sequence > state.id
          else
$stderr.puts "onconnect #{id} ##{clients.length} no state"
            active_clients.each do |client|
              client.close_websocket
              client.closing = true
            end
          end

$stderr.puts "onconnect #{id} ##{clients.length} launch state #{ thing.storage.state }"

          state = thing.storage.state
          time = state[ "kernel" ][ "time" ] || 0

          pending_clients.each do |client|
            client.send "time" => time, "action" => "setState", "parameters" => [ state ]  # TODO: ... actions too ... start new ... but waive recent state test
            client.pending = false
          end

        end

      end

    end

    # Create a child in the application's `clients.vwf` global to represent this client.

    broadcast "action" => "createChild", "parameters" => [ "http-vwf-example-com-clients-vwf", id, {} ]

  end

  def onmessage message

    super

    fields = JSON.parse message, :max_nesting => 100

    # Handle messages where the client returned a result to the server.

    if fields[ "result" ]
      receive fields
      return
    end

    # For a normal message, stamp it with the curent time and originating client, and send it to
    # each client.

    broadcast fields.reject { |key, value| key == "time" } .merge "client" => id  # TODO: allow future times on incoming fields["time"] and queue until needed

  end

  def ondisconnect

    # Stop the timer after the last disconnection from this instance.

    if clients.length == 1  # going to 0
      thing.transport.stop
    end

    # Delete the child representing this client in the application's `clients.vwf` global.

    broadcast "action" => "deleteChild", "parameters" => [ "http-vwf-example-com-clients-vwf", id ]

    logger.debug "VWF::Application::Reflector#disconnect #{resource} #{id} disconnecting"

    super

  end

  # Override the socket.io #send to accept messages as a fields hash and to record a detailed log
  # when enabled.

  def send message, log = true

    if Hash === message # magic when passed a fields Hash

      fields = Hash[
        "time" => thing.transport.time
      ] .merge message

      message = JSON.generate fields, :max_nesting => 100

      logger.debug "VWF::Application::Reflector#send #{resource} #{id} #{ message_for_log message }" if log

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

    fields = Hash[
      "time" => thing.transport.time
    ] .merge action

    if fields[ "action" ]
      if thing.storage.respond_to? :actions
        thing.storage.actions.create thing.sequencenext.to_s, fields
      end
    end

    message = JSON.generate fields, :max_nesting => 100

    logger.debug "VWF::Application::Reflector#broadcast #{resource} #{id} #{ message_for_log message }" if log

    active_clients.each do |client| # established clients: same as in super
      next if client.closing
      client.log fields, :send if log
      client.send message, false
    end

  end

  # Send an action to the collective client and retrieve the result.

  def really_request action, timeout = 10, count = nil, scoreboard = nil, &block

    unless scoreboard

      scoreboard = {
        :timeout => timeout,    # cumulative timeout
        :clients => [],         # clients asked so far
        :completed => false     # any response yet?
      }

      count = 1                 # sample size for this interval
      timeout = 0.125           # timeout for this interval

    end

    sample = ( active_clients - scoreboard[ :clients ] ).sample( count ).tap do |sample|
      scoreboard[ :clients ].concat( sample )
    end

    if sample.length > 0
      scoreboard[ :timeout ] -= timeout
    else
      timeout = [ 0, scoreboard[ :timeout ] ].max
    end

    sample.each do |client|
      client.request( action ) do |sequence, result|
        unless scoreboard[ :completed ]
          scoreboard[ :completed ] = true
          yield sequence, result
        end    
      end
    end

    EventMachine::Timer.new( timeout ) do
      unless scoreboard[ :completed ]
        if sample.length > 0
          really_request action, timeout * 2, count * 2, scoreboard, &block
        else
          yield nil, nil
        end
      end
    end

  end

  def receive fields

    logger.debug "VWF::Application::Reflector#receive #{resource} #{id} #{ message_for_log fields }"

    log fields, :receive

    if fields[ "result" ]
      response fields[ "result" ]
    end

  end

  # Send an action to a client and retrieve the result.

  def request action, &block

    send action.merge "respond" => true
    thing.requests << { :sequence => thing.sequence, :callback => block }

  end

  # Receive the result from a `request` call.

  def response result

    if request = thing.requests.shift
      request[ :callback ].call request[ :sequence ], result
    end

  end

  # Detailed log of a fields Hash.

  def log fields, direction

    if false  # TODO: provide a configuration option; this is a heavy operation and we only want to use it for trace-level debugging

      # Log to a directory under "log/" matching the application's location in "public/" plus
      # application/instance/client. Log messages for each unique time to a separate file.

      path = File.join "log", resource, id

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

  # def self.instances env
  #   Hash[ *
  #     instance_sessions( env ).map do |resource, session|
  #       [ resource, Hash[ :clients => clients( resource ) ] ]
  #     end .flatten( 1 )
  #   ]
  # end

  # Instances derived from the resource that this client connects to, and clients connected to those
  # instances.

  # def instances
  #   Hash[ *
  #     instance_sessions.map do |resource, session|
  #       [ resource, Hash[ :clients => self.class.clients( resource ) ] ]
  #     end .flatten( 1 )
  #   ]
  # end

  attr_accessor :pending, :closing

private

  def thing
    session[ :thing ] ||= Thing.new @storage do
      broadcast( {}, false )
    end
  end

  # def self.clients env
  #   session = self.session env
  #   super - ( session[:pending] ? session[:pending][:clients] : [] ) - ( session[:stasis] || [] )
  # end

  # def clients
  #   super - ( session[:pending] ? session[:pending][:clients] : [] ) - ( session[:stasis] || [] )
  # end

  def active_clients
    clients.reject do |client|
      client.pending || client.closing
    end
  end

  def pending_clients
    clients.select do |client|
      client.pending
    end
  end

public


# client uses default configuration, sequence = 0, time = 0; to set configuration? add clients.vwf? init seq + time t 0; next message should be 1, +dt


  class Thing

    attr_reader :storage, :sequence, :requests, :transport

    def initialize storage

      @storage = storage

      if storage.respond_to? :states
        if state_pair = storage.states.reverse_each.first
          state_sequence = state_pair[ 1 ].id.to_i
        end
      end

      if storage.respond_to? :actions
        if action_pair = storage.actions.reverse_each.first
          action_sequence = action_pair[ 1 ].id.to_i
        end
      end

      @sequence = [
        state_sequence || 0,
        action_sequence || 0
      ].max

      @requests = []

      @transport = Transport.new do
        yield if block_given?
      end

    end

    def sequencenext
      @sequence += 1
    end

    def uncapped_actions

      if @storage.respond_to? :states
        if state_pair = @storage.states.reverse_each.first
          state_sequence = state_pair[ 1 ].id.to_i
        end
      end

      if @storage.respond_to? :actions
        if action_pair = @storage.actions.reverse_each.first
          action_sequence = action_pair[ 1 ].id.to_i
        end
      end

      ( action_sequence || 0 ) - ( state_sequence || 0 )

    end

  end

  class Transport

    def initialize &tick
      @start_time = nil
      @pause_time = nil
      @rate = 1
      @tick = tick
    end

    def play time = nil
      if stopped
        @start_time = Time.now - ( time || 0 )
        @timer = EventMachine::PeriodicTimer.new( 0.05 ) { @tick.call unless @pause_time } if @tick  # TODO: configuration parameter for update rate
      end
    end

    def pause
      if playing
        @pause_time = Time.now
      end
    end

    def resume
      if paused
        @start_time += Time.now - @pause_time
        @pause_time = nil
      end
    end

    def stop
      if playing || paused
        @start_time = nil
        @pause_time = nil
        @timer.cancel
        @timer = nil
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

    def time= time
      if playing
        @start_time = Time.now - time / rate
      elsif paused
        @start_time = @pause_time - time / rate
      end
    end

    def rate
      @rate
    end

    def rate= rate
      if playing || paused
        time = self.time
        @rate = rate
        self.time = time
      end
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
