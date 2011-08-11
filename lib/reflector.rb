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

    send JSON.generate :time => 0, :node => nil, :action => "createNode", :parameters => [ env["vwf.application"] ]  # TODO: get current time, also current application state
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

    session[:time] ||= {

      :start_time => Time.now,  # TODO: initialize using a play method on a simulation object
      :pause_time => nil,

      :timer => EventMachine::PeriodicTimer.new( 0.1 ) do  # TODO: configuration parameter for update rate
        if session[:time][:start_time] && !session[:time][:pause_time]
          broadcast JSON.generate :time => Time.now - session[:time][:start_time]
        end
      end

    }

  end
  
end
