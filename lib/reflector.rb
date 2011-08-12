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

    unless session[:transport]
      transport = session[:transport] = Transport.new
      session[:timer] = EventMachine::PeriodicTimer.new( 0.1 ) do  # TODO: configuration parameter for update rate
        transport.playing and broadcast JSON.generate :time => transport.time
      end
      transport.play
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
