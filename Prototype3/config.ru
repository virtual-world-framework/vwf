require "init"

map "/" do
  run Server

  # Component.set :app_file, File.expand_path( __FILE__ )
  # Component.set :app_file, File.expand_path( File.join( File.dirname(__FILE__), "init.rb" ) )
  # run Component
end
