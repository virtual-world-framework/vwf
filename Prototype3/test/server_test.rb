require "helper"

class ServerTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def app
    Server
  end

  def test_serves_client_files

    get "/index.html"
    assert last_response.ok?
    
    assert last_response.body.include?( "vwf.initialize" )

  end

  def test_serves_types_as_json

    get "/types/abc"
    assert last_response.ok?

    component = JSON.parse last_response.body
    assert_not_nil component["extends"]
    assert_not_nil component["properties"]
    assert_not_nil component["properties"]["abc"]

  end

  def test_serves_types_as_jsonp

    callback = "test_callback_function_name"

    get "/types/abc?callback=#{callback}"
    assert last_response.ok?

    assert_match /^#{callback}\(.*\)$/, last_response.body

  end


  # / => /index.html for application "index"
  # /index.html => /index.html for application "index"
  # /index.css => /index.css for application "index"

  # /application => /index.html for application "application"
  # /application/index.html => /index.html for application "application"
  # /application/index.css => /index.css for application "application"

  # /directory/ => /index.html for application "index"
  # /directory/index.html => /index.html for application "index"
  # /directory/index.css => /index.css for application "index"

  # /directory/application => /index.html for application "application"
  # /directory/application/index.html => /index.html for application "application"
  # /directory/application/index.css => /index.css for application "application"



  def test_delegates_to_test_test

    get "/test/test"
    assert_equal "index", last_response.body

    get "/test/test/a"
    assert_equal "A", last_response.body

    get "/test/test/b"
    assert_equal "B", last_response.body

  end

end
