require "erb"

class VWF::Application::Admin < Sinatra::Base

  configure do
    set :app_file, VWF.settings.app_file
  end

  get "/" do
    erb :"admin.html"
  end

  get "/state" do  # TODO: should be post but server.rb isn't handling post and delegating down

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      state = Rack::Utils.parse_query request.query_string
      state[:rate] = state["rate"].to_f unless state["rate"].nil? || state["rate"].empty?
      transport.rate = state[:rate] unless state[:rate].nil? || state[:rate] == 0
      # TODO: other fields
      transport.state.to_json
    end

  end

  post "/time" do

    # TODO?

  end

  post "/rate" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      body = request.body.read
      rate = body.to_f unless body.empty?
      transport.rate = rate unless rate.nil? || rate == 0
      transport.state.to_json
    end

  end

  get "/play" do  # TODO: should be post but server.rb isn't handling post and delegating down

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.play
      transport.state.to_json
    end

  end

  get "/pause" do  # TODO: should be post but server.rb isn't handling post and delegating down

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.pause
      transport.state.to_json
    end

  end

  get "/stop" do  # TODO: should be post but server.rb isn't handling post and delegating down

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.stop
      transport.state.to_json
    end

  end

end
