require "socketioapplication"

class Socketsss < SocketIOApplication

  def onconnect
    logger.info "SocketIOApplication#onconnect"

    send "0 createNode index"
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
