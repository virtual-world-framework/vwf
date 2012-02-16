require "erb"

class VWF::Application::Admin < Sinatra::Base

  configure do
    set :root, VWF.settings.root
  end

  get "/" do
    erb :"admin.html"
  end

  # get "/state" do  # TODO: restore when next handler is switched back to post
  # 
  #   if transport = Rack::SocketIO::Application.session( env )[:transport]
  #     transport.state.to_json
  #   end
  # 
  # end

  get "/state" do  # TODO: switch to post; find substitute for query_string to parse

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

  post "/play" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.play
      transport.state.to_json
    end

  end

  post "/pause" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.pause
      transport.state.to_json
    end

  end

  post "/stop" do

    if transport = Rack::SocketIO::Application.session( env )[:transport]
      transport.stop
      transport.state.to_json
    end

  end

  # Instances derived from this application, clients connected to those instances, and client
  # details (none currently).

  get "/instances" do

    Hash[ *
      VWF::Application::Reflector.instances( env ).map do |resource, instance|
        [ resource, Hash[ :clients => Hash[ * instance[:clients].map { |client| [ client.id, nil ] } .flatten( 1 ) ] ] ]
      end .flatten( 1 )
    ] .to_json

  end

end
