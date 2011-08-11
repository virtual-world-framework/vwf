require "erb"

class Admin < Sinatra::Base

  get "/admin" do
    erb :"admin.html"
  end

  get "/play" do  # TODO: should be post but server.rb isn't handling post and delegating down
    time = SocketIOApplication.session( env["SCRIPT_NAME"] )[:time]
    time[:start_time] = Time.now  # TODO: delegate to play method on a simulation object
    time[:pause_time] = nil
    "playing"
  end

  get "/pause" do  # TODO: should be post but server.rb isn't handling post and delegating down
    time = SocketIOApplication.session( env["SCRIPT_NAME"] )[:time]
    time[:pause_time] = Time.now  # TODO: delegate to play method on a simulation object
    "paused"
  end

  get "/resume" do  # TODO: should be post but server.rb isn't handling post and delegating down
    time = SocketIOApplication.session( env["SCRIPT_NAME"] )[:time]
    time[:start_time] += Time.now - time[:pause_time]  # TODO: delegate to play method on a simulation object
    time[:pause_time] = nil
    "resumed"
  end

  get "/stop" do  # TODO: should be post but server.rb isn't handling post and delegating down
    time = SocketIOApplication.session( env["SCRIPT_NAME"] )[:time]
    time[:start_time] = nil  # TODO: delegate to play method on a simulation object
    time[:pause_time] = nil
    "stopped"
  end

end
