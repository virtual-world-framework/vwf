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

require "securerandom"

module Rack

  module SocketIO

    class Application < Rack::WebSocket::Application

      attr_reader :env
      attr_reader :closing
  
      @@clients = {}  # TODO: threading issues? use mutex on access?
      @@sessions = {}  # TODO: threading issues? use mutex on access?

      def initialize resource = nil
        super Hash.new
        @resource = resource
      end

      def _call env
        @env = env
        super
      end

      def onconnect

        logger.info "Rack::SocketIO::Application#onconnect #{id}"

        @@clients[ resource ] ||= []
        @@clients[ resource ] << self

        @@sessions[ resource ] ||= {}

      end

      def onmessage message

        logger.debug "Rack::SocketIO::Application#onmessage #{id} #{ message_for_log message }"

      end

      def ondisconnect

        logger.info "Rack::SocketIO::Application#ondisconnect #{id}"

        @@clients[ resource ].delete self
        
        if @@clients[ resource ].empty?
          @@clients.delete resource
          @@sessions.delete resource
        end

      end

      def send message, log = true

        log and logger.debug "Rack::SocketIO::Application#send #{id} #{ message_for_log message }"

        # unless connected
        #   queue message  # TODO
        # else
          if message.is_a?( Array ) || message.is_a?( Hash )
            send_serialization "~j~" + JSON.generate( message )  # TODO: errors
          else
            send_serialization message.to_s
          end
        # end

      end

      def broadcast message, log = true

        log and logger.debug "Rack::SocketIO::Application#broadcast #{id} #{ message_for_log message }"

        clients.each do |client|
          client.send message, false unless client.closing
        end

      end

      def schedule_heartbeat

        @heartbeat_interval = EventMachine::Timer.new 10 do  # TODO: options.heartbeat_interval

          send_heartbeat ( @heartbeats += 1 ).to_s unless @closing

          @heartbeat_timeout = EventMachine::Timer.new 8 do  # TODO: options.timeout

            # logger.debug "Rack::SocketIO::Application#schedule_heartbeat #{id} timeout #{ @heartbeats }"

            @heartbeat_timeout = nil
            close_websocket

            # close_websocket doesn't call on_close until the other side closes, so the connection
            # still appears to be open. But we must not send to it since EventMachine::WebSocket
            # will throw an exception.

            @closing = true

          end

          @heartbeat_interval = nil

        end

      end

      def cancel_heartbeat

        if @heartbeat_interval
          @heartbeat_interval.cancel
          @heartbeat_interval = nil
        end

        if @heartbeat_timeout
          @heartbeat_timeout.cancel
          @heartbeat_timeout = nil
        end

      end

      def on_heartbeat message

        # logger.debug "Rack::SocketIO::Application#on_heartbeat #{id} #{ message_for_log message }"

        if message.to_i == @heartbeats
          cancel_heartbeat
          schedule_heartbeat
        end

      end

      def send_heartbeat message

        # logger.debug "Rack::SocketIO::Application#send_heartbeat #{id} #{ message_for_log message }"

        send_serialization "~h~" + message

      end

      def on_serialization serialization

        # logger.debug "Rack::SocketIO::Application#on_serialization #{serialization}"

        case serialization[0, 3]
          when "~h~"
            on_heartbeat serialization[3..-1]
          when "~j~"
            begin
              onmessage JSON.parse serialization[3..-1]
            rescue JSON::ParserError
              # TODO: error
            end
          else
            onmessage serialization
        end

      end

      def send_serialization *serializations

        # logger.debug "Rack::SocketIO::Application#send_serialization #{serializations}"

        data = serializations.reduce "" do |data, serialization|
          data + "~m~" + serialization.length.to_s + "~m~" + serialization
        end

        # logger.debug "Rack::WebSocket::Application#send_data #{data}"

        begin
          send_data data
        rescue EventMachine::WebSocket::WebSocketError => exception
          if exception.message.match /connection is closing$/
            logger.info "Rack::SocketIO::Application#send_serialization #{id} #{ message_for_log data } ignoring exception from sending to a closing connection"
            logger.info exception
          else
            raise
          end
        end

      end

      def on_open env

        # logger.debug "Rack::SocketIO::Application#on_open #{id}"

        @heartbeats = 0

        # if the incoming url has a session id, set the local id to it
        # else, generate a new one and send it
        
        if matchdata = env["PATH_INFO"].match( %r{^/(socket|websocket)/(?<id>.+)(/|$)} )  # TODO: configuration parameter for paths accepted; "websocket/session" is for socket.io
          self.id = matchdata[:id]
        else
          send_serialization id
        end

        schedule_heartbeat
        onconnect

      end

      def on_message env, data

        # logger.debug "Rack::WebSocket::Application#on_data #{data}"

        until data.empty?
          if matchdata = data.match( /~m~(\d+)~m~/ )
            match, length = *matchdata
            on_serialization data[match.length, length.to_i]
            data = data[match.length+length.to_i..-1] || ""
          else
            break # TODO: error
          end
        end

      end
  
      def on_close env

        # logger.debug "Rack::SocketIO::Application#on_close #{id}"

        cancel_heartbeat
        ondisconnect

      end
  
      def on_error env, err
        # logger.debug "Rack::SocketIO::Application#on_error #{err}"
      end

      # The session data for the given resource, or nil if no session for that resource exists.

      def self.session env
        @@sessions[resource env]
      end

      # The session data for the resource that this client connects to.

      def session
        @@sessions[ resource ] ||= {}
      end

      # Session data for the instances derived from the given resource.

      def self.instance_sessions env
        @@sessions.select do |resource, session|
          resource.start_with? self.resource env
        end
      end

      # Session data for the instances derived from the resource that this client connects to.

      def instance_sessions
        @@sessions.select do |resource, session|
          resource.start_with? resource
        end
      end

      # This client's id. Generate it when first accessed.

      def id
        @id ||= SecureRandom.hex
      end

      attr_writer :id

    private

      # The clients connected to the given resource, or nil if no session for that resource exists.

      def self.clients env
        @@clients[resource env]
      end

      # The clients connected to the resource that this client connects to.

      def clients
        @@clients[ resource ]
      end
  
      # The socket.io resource for a given environment.
      
      def self.resource env
        unless env.kind_of? String
debugger  # TODO: can't work with instance variables
        else
          env # pass through if the parameter is already a resource
        end
      end

      # The socket.io resource this client connects to.
  
      def resource
        @resource || env[ "SCRIPT_NAME" ]
      end

      MESSAGE_LOG_LENGTH = 1000

      def message_for_log message
        message = message.to_s
        message.length > MESSAGE_LOG_LENGTH ? message[0,MESSAGE_LOG_LENGTH-3] + "..." : message
      end

      def logger
        @env["rack.logger"] || Object.new
      end
      
    end

  end

end
