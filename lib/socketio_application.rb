class SocketIOApplication < Rack::WebSocket::Application

  attr_reader :env
  
  @@sessions = {}  # TODO: threading issues? use mutex on access?

  def _call env
    @env = env  # TODO: env only needed for logger call; do another way & omit this override?
    super
  end

  def onconnect

    logger.info "SocketIOApplication#onconnect"

    @endpoint = File.join env["SCRIPT_NAME"] || "", env["PATH_INFO"] || ""  # TODO: set to nil after dup?

    @@sessions[@endpoint] ||= { :clients => [], :session => {} }
    @@sessions[@endpoint][:clients] << self

puts YAML.dump @@sessions.merge(@@sessions) { |k,ov| ov.merge(ov) { |k,ov| Array === ov ? ov.map { |v| v.to_s } : ov.to_s } }

  end

  def onmessage message

    logger.debug "SocketIOApplication#onmessage #{ message_for_log message }"

  end

  def ondisconnect

    logger.info "SocketIOApplication#ondisconnect"

  end

  def send message

    logger.debug "SocketIOApplication#send #{ message_for_log message }"

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

    logger.debug "SocketIOApplication#broadcast #{ message_for_log message }"

    clients.each do |client|
      client.send message
    end

  end

  def schedule_heartbeat
    @heartbeat_interval = EventMachine::Timer.new 10 do  # TODO: options.heartbeat_interval
      send_heartbeat ( @heartbeats += 1 ).to_s
      @heartbeat_timeout = EventMachine::Timer.new 8 do  # TODO: options.timeout
        # logger.debug "SocketIOApplication#schedule_heartbeat timeout #{@heartbeats}"
        # TODO: close
      end
    end
  end

  def on_heartbeat message
    # logger.debug "SocketIOApplication#on_heartbeat #{ message_for_log message }"
    if message.to_i == @heartbeats
      @heartbeat_timeout.cancel
      schedule_heartbeat
    end
  end

  def send_heartbeat message
    # logger.debug "SocketIOApplication#send_heartbeat #{ message_for_log message }"
    send_serialization "~h~" + message
  end

  def on_serialization serialization
    # logger.debug "SocketIOApplication#on_serialization #{serialization}"
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
    # logger.debug "SocketIOApplication#send_serialization #{serializations}"
    data = serializations.reduce "" do |data, serialization|
      data + "~m~" + serialization.length.to_s + "~m~" + serialization
    end
    # logger.debug "Rack::WebSocket::Application#send_data #{data}"
    send_data data
  end

  def on_open env
    # logger.debug "SocketIOApplication#on_open"
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
    # logger.debug "SocketIOApplication#on_close"
  end
  
  def on_error env, err
    # logger.debug "SocketIOApplication#on_error #{err}"
  end

private

  MESSAGE_LOG_LENGTH = 100

  def message_for_log message
    message = message.to_s
    message.length > MESSAGE_LOG_LENGTH ? message[0,MESSAGE_LOG_LENGTH-3] + "..." : message
  end

  def logger
    @env["rack.logger"] || Object.new
  end

  def clients
    @endpoint and @@sessions[@endpoint][:clients]
  end
  
  def session
    @endpoint and @@sessions[@endpoint][:session]
  end

end
