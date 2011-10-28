module Rack
  module SocketIO

    class Application < Rack::WebSocket::Application

      attr_reader :env
  
      @@clients = {}  # TODO: threading issues? use mutex on access?
      @@sessions = {}  # TODO: threading issues? use mutex on access?

      def _call env
        @env = env  # TODO: env only needed for logger call; do another way & omit this override?
        super
      end

      def onconnect

        logger.info "Rack::SocketIO::Application#onconnect #{ object_id }"

        @@clients[resource] ||= []
        @@clients[resource] << self

        @@sessions[resource] ||= {}

puts YAML.dump @@sessions.merge(@@sessions) { |k,ov| ov.merge(ov) { |k,ov| Array === ov ? ov.map { |v| v.to_s } : ov.to_s } }

      end

      def onmessage message

        logger.debug "Rack::SocketIO::Application#onmessage #{ object_id } #{ message_for_log message }"

      end

      def ondisconnect

        logger.info "Rack::SocketIO::Application#ondisconnect #{ object_id }"

        @@clients[resource].delete self
        
        if @@clients[resource].empty?
          @@clients.delete resource
          @@sessions.delete resource
        end

puts YAML.dump @@sessions.merge(@@sessions) { |k,ov| ov.merge(ov) { |k,ov| Array === ov ? ov.map { |v| v.to_s } : ov.to_s } }

      end

      def send message

        logger.debug "Rack::SocketIO::Application#send #{ object_id } #{ message_for_log message }"

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
  
      def broadcast message

        logger.debug "Rack::SocketIO::Application#broadcast #{ object_id } #{ message_for_log message }"

        clients.each do |client|
          client.send message
        end

      end

      def schedule_heartbeat

        @heartbeat_interval = EventMachine::Timer.new 10 do  # TODO: options.heartbeat_interval

          send_heartbeat ( @heartbeats += 1 ).to_s

          @heartbeat_timeout = EventMachine::Timer.new 8 do  # TODO: options.timeout
            # logger.debug "Rack::SocketIO::Application#schedule_heartbeat #{ object_id } timeout #{ @heartbeats }"
            @heartbeat_timeout = nil
            close_websocket
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

        # logger.debug "Rack::SocketIO::Application#on_heartbeat #{ object_id } #{ message_for_log message }"

        if message.to_i == @heartbeats
          cancel_heartbeat
          schedule_heartbeat
        end

      end

      def send_heartbeat message

        # logger.debug "Rack::SocketIO::Application#send_heartbeat #{ object_id } #{ message_for_log message }"
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

        send_data data

      end

      def on_open env

        # logger.debug "Rack::SocketIO::Application#on_open #{ object_id }"

        @session_id = rand( 1000000 ).to_s  # TODO: more random, map to server's actual session
        @heartbeats = 0
        send_serialization @session_id
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

        # logger.debug "Rack::SocketIO::Application#on_close #{ object_id }"

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

      # The session data for the resource that this instance connects to.

      def session
        @@sessions[resource]
      end

    private

      # The clients connected to the given resource, or nil if no session for that resource exists.

      def self.clients env
        @@clients[resource env]
      end

      # The clients connected to the resource that this instance connects to.

      def clients
        @@clients[resource]
      end
  
      # The socket.io resource for a given environment.
      
      def self.resource env
        env["vwf.session"] ?
          ::File.join( env["vwf.root"], env["vwf.application"], env["vwf.session"] ) :
          ::File.join( env["vwf.root"], env["vwf.application"] )  # TODO: shouldn't use File.join, but URI.join only works from an absolute url
      end

      # The socket.io resource this instance connects to.
  
      def resource
        env["vwf.session"] ?
          ::File.join( env["vwf.root"], env["vwf.application"], env["vwf.session"] ) :
          ::File.join( env["vwf.root"], env["vwf.application"] )  # TODO: shouldn't use File.join, but URI.join only works from an absolute url
      end

      MESSAGE_LOG_LENGTH = 100

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
