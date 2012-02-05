require "helper"

class VWFTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def app
    VWF
  end

  def test_serves_components_as_json

    get "/directory/component.vwf"
    assert last_response.ok?

    component = JSON.parse last_response.body
    assert_not_nil component["extends"]
    assert_not_nil component["properties"]
    assert_equal "component", component["properties"]["file"]
    
  end

  def test_serves_components_as_jsonp

    callback = "test_callback_function_name"

    get "/directory/component.vwf?callback=#{callback}"
    assert last_response.ok?

    assert_match /^#{callback}\(.*\)$/, last_response.body

    component = JSON.parse last_response.body[ /#{callback}\s*\(\s*(.*)\s*\)/, 1 ]
    assert_not_nil component["extends"]
    assert_not_nil component["properties"]
    assert_equal "component", component["properties"]["file"]

  end

  def test_renders_components_from_json

    get "/directory/json.vwf" # /directory/json.vwf.json
    assert last_response.ok?

    component = JSON.parse last_response.body
    assert_equal "json", component["properties"]["template"]
    
  end

  def test_renders_components_from_yaml

    get "/directory/yaml.vwf" # /directory/yaml.vwf.yaml
    assert last_response.ok?

    component = JSON.parse last_response.body
    assert_equal "yaml", component["properties"]["template"]
    
  end

  # Redirects the application at the root to a new session for that application.

  def test_root
    get "/"
    assert last_response.redirection?
    assert_match %r{/[[:xdigit:]]{16}/$}, last_response.location
  end

  # Redirects an application specified using a file URL (no trailing slash) to its directory URL
  # (trailing slash).

  def test_application_as_file_url
    get "/directory/component.vwf", {}, "HTTP_ACCEPT" => "text/html"
    assert last_response.redirection?
    assert_match %r{/directory/component.vwf/$}, last_response.location
  end

  # But doesn't redirect for an XHR request for a component file.

  def test_application_as_file_url_from_xhr
    get "/directory/component.vwf"  # TODO: verify the HTTP_ACCEPT headers for an XHR for a component
    assert last_response.ok? # 200, not 3xx
  end

  # Redirects an application to a new session for that application.

  def test_application_as_directory_url
    get "/directory/component.vwf/"
    assert last_response.redirection?
    assert_match %r{/[[:xdigit:]]{16}/$}, last_response.location
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
    # Rack::Test doesn't support WebSockets, but this exception from Rack::WebSocket at least tells
    # us we got that far.
    exception = assert_raises RuntimeError do
      get "/directory/component.vwf/0000000000000000/socket", {}, "SERVER_SOFTWARE" => ""  # Rack::WebSocket::Handler requires SERVER_SOFTWARE to be non-nil
    end
    assert_match /unknown handler/i, exception.message
  end

  # Serves a client index file from an application session when an explicit index is not provided.

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
    get "/directory/component.vwf/0000000000000000/socket.io.js"
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



end
