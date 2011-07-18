class TestServer < Sinatra::Base

  get "/" do
    "index"
  end

  get "/a" do
    "A"
  end

  get "/b" do
    "B"
  end

end
