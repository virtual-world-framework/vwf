require "socketio_application"

class Reflector < SocketIOApplication

  def call env
    if env["PATH_INFO"] =~ %r{^/(socket|websocket)(/|$)}  # TODO: configuration parameter for paths accepted; "websocket/session" is for socket.io
      super
    else
      404
    end
  end

  def onconnect
    logger.info "SocketIOApplication#onconnect"

    send "0 createNode index.vwf"  # TODO
    schedule_tick
  end
  
  def onmessage message
    logger.info "SocketIOApplication#onmessage #{message}"
  end
  
  def ondisconnect
    logger.info "SocketIOApplication#ondisconnect"
  end

private

  def schedule_tick
    @tick_timer = EventMachine::PeriodicTimer.new 2 do
      send Time.now.to_f  # TODO: play/pause/stop, start at 0
    end
  end
  
end
