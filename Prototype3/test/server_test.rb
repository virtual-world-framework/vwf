require "helper"

class ServerTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def app
    Server
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

  # Redirects the application at the root to a new session for that application.

  def test_root
    get "/"
    assert last_response.redirection?
    assert_match %r{/0000000000000000/$}, last_response.location
  end

  # Redirects an application specified using a file URL (no trailing slash) to its directory URL
  # (trailing slash).

  def test_application_as_file_url
    get "/directory/component.vwf"
    assert last_response.redirection?
    assert_match %r{/directory/component.vwf/$}, last_response.location
  end

  # Redirects an application to a new session for that application.

  def test_application_as_directory_url
    get "/directory/component.vwf/"
    assert last_response.redirection?
    assert_match %r{/0000000000000000/$}, last_response.location
  end

  # Redirects an application session specified using a file URL (no trailing slash) to its
  # directory URL (trailing slash).

  def test_application_session_as_file
    get "/directory/component.vwf/0000000000000000"
    assert last_response.redirection?
    assert_match %r{/directory/component.vwf/0000000000000000/$}, last_response.location
  end

  # Successfully loads an application session.

  def test_application_session_as_directory
    get "/directory/component.vwf/0000000000000000/"
    assert last_response.ok?
  end

  # Connects to an application session's socket.

  def test_application_session_socket
    # get "/directory/component.vwf/0000000000000000/socket"  # TODO: this causes an error in websocket-rack
    # assert ???
  end

  # Serves a client index file from an application session when an implicit index is not provided.

  def test_application_session_client_default_index
    get "/directory/component.vwf/0000000000000000/"
    assert last_response.ok?
    assert last_response.body.include?( "vwf.initialize" )
  end

  # Serves a client file from an application session.

  def test_application_session_client_explicit_index
    get "/directory/component.vwf/0000000000000000/index.html"
    assert last_response.ok?
    assert last_response.body.include?( "vwf.initialize" )
  end

  # Serves the socket.io client from an application session.

  def test_application_session_socketio_client
    get "/directory/component.vwf/0000000000000000/socket.io/socket.io.js"
    assert last_response.ok?
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
