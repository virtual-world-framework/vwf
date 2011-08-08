require "erb"

class Admin < Sinatra::Base

  get "/admin" do

    erb :"admin.html"
  
  end

end
