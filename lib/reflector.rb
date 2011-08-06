require "socketio_application"
require "json"

class Reflector < SocketIOApplication

  def call env
    if env["PATH_INFO"] =~ %r{^/(socket|websocket)(/|$)}  # TODO: configuration parameter for paths accepted; "websocket/session" is for socket.io
      super
    else
      404
    end
  end

  def onconnect

    super

    send JSON.generate :time => 0, :node => nil, :action => "createNode", :parameters => [ env["vwf.application"] ]
    schedule_tick

  end
  
  def onmessage message
    super
    broadcast message
  end
  
  def ondisconnect
    super
  end

private

  def schedule_tick
    session[:tick_timer] ||= EventMachine::PeriodicTimer.new 2 do
      broadcast JSON.generate :time => Time.now.to_f  # TODO: play/pause/stop, start at 0
    end
  end
  
end
