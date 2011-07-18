require "socketioapplication"

class Socketsss < SocketIOApplication

  def onconnect
    logger.info "SocketIOApplication#onconnect"
  end
  
  def onmessage message
    logger.info "SocketIOApplication#onmessage #{message}"
  end
  
  def ondisconnect
    logger.info "SocketIOApplication#ondisconnect"
  end
  
end
