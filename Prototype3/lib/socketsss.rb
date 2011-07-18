class Socketsss < Rack::WebSocket::Application

  def on_open env
    puts "client connected"

    puts "client " + env["async.connection"].object_id.to_s
    EM.add_timer 5 do
      send_data "This message should show-up 5 secs later"
    end

    EM.add_timer 15 do
      send_data "This message should show-up 15 secs later"
    end

  end

  def on_message env, msg

    puts "client " + env["async.connection"].object_id.to_s
    puts "message received: " + msg
    send_data "Message: #{msg}"

  end

  def on_close env

    puts "client " + env["async.connection"].object_id.to_s
    puts "client disconnected"

  end

end
