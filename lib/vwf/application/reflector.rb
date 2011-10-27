require "rack/socket-io/application"
require "json"

class VWF::Application::Reflector < Rack::SocketIO::Application

  def call env
    if env["PATH_INFO"] =~ %r{^/(socket|websocket)(/|$)}  # TODO: configuration parameter for paths accepted; "websocket/session" is for socket.io
      super
    else
      [ 404, {}, [] ]
    end
  end

  def onconnect

    super

    session[:pending_clients] ||= {}
    session[:pending_clients][self] = true

    if clients.length > session[:pending_clients].size
      clients.first.send JSON.generate :time => session[:transport].time, :node => 0, :action => "getNode", :parameters => []
    else
      session[:pending_clients].delete self
    end

    send JSON.generate :time => 0, :node => nil, :action => "createNode", :parameters => [ env["vwf.application"] ]  # TODO: get current time, also current application state

# if clients.size > 1
#   clients.first.send JSON.generate :time => session[:transport].time, :node => 0, :action => "getNode", :parameters => []
# end

#     send JSON.generate :time => 0, :node => nil, :action => "createNode", :parameters => [ env["vwf.application"] ]  # TODO: get current time, also current application state

# send JSON.generate :time => 0, :node => nil, :action => "setNode", :parameters => [
#   "busybox-vwf-undefined",
#   { :extends => { :children => [ { :properties => { :on => false } }, { :properties => { :on => true } } ] } }
# ]

    schedule_tick

  end
  
  def onmessage message

    super

    if message =~ /"action":"getNode"/
      state = JSON.parse( message )["result"]  # TODO: error
      session[:pending_clients].each do |client, dummy|
        client.send JSON.generate :time => session[:transport].time, :node => 0, :action => "setNode", :parameters => [ state ]
      end
      session[:pending_clients].clear
    else
      broadcast message
    end

  end
  
  def ondisconnect

    cancel_tick

    session[:pending_clients].delete self

    super

  end

private

  def schedule_tick

    if clients.length == 1
      transport = session[:transport] = Transport.new
      session[:timer] = EventMachine::PeriodicTimer.new( 0.1 ) do  # TODO: configuration parameter for update rate
        transport.playing and broadcast JSON.generate :time => transport.time
      end
      transport.play
    end

  end
  
  def cancel_tick

    if clients.length == 1
      session[:timer].cancel
      session.delete :timer
      session[:transport].stop
      session.delete :transport
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
