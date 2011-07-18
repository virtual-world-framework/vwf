require "helper"

class ServerTest
  
  class ApplicationPatternTest < Test::Unit::TestCase
    include Rack::Test::Methods

    # Assume these directories, containing these files.

    MOCK_FILESYSTEM =
    {
      "/" =>                [ "index", "component" ],
      "/directory" =>       [ "index", "component" ]
    }

    def setup
      @application_pattern = Server::ApplicationPattern.new
      @application_pattern.mock_filesystem = MOCK_FILESYSTEM
    end

    # Locates the index application at the root.

    def test_root_with_index
      assert_pattern_match [ "/", "index", nil, nil, nil ], "/"
    end

    # Locates a named application at the root.

    def test_root_file
      assert_pattern_match [ "/component", "component", nil, nil, nil ], "/component/"
    end

    # Locates the index application in a directory.

    def test_directory_with_index
      assert_pattern_match [ "/directory", "index", nil, nil, nil ], "/directory/"
    end
    
    # Locates a named application in a directory.

    def test_file
      assert_pattern_match [ "/directory/component", "component", nil, nil, nil ], "/directory/component/"
    end
    
    # Locates no application for a non-directory URL (no trailing slash).

    def test_application_as_file
      assert_pattern_match [ "/component", nil, nil, nil, nil ], "/component"
      assert_pattern_match [ "/directory", nil, nil, nil, nil ], "/directory"
      assert_pattern_match [ "/directory/component", nil, nil, nil, nil ], "/directory/component"
    end

    # Locates the application when specified as a directory URL (with a trailing slash).

    def test_application_as_directory
      assert_pattern_match [ "/", "index", nil, nil, nil ], "/"
      assert_pattern_match [ "/component", "component", nil, nil, nil ], "/component/"
      assert_pattern_match [ "/directory", "index", nil, nil, nil ], "/directory/"
      assert_pattern_match [ "/directory/component", "component", nil, nil, nil ], "/directory/component/"
    end

    # Identifies the socket path.

    def test_application_with_socket
      assert_pattern_match [ "/", "index", nil, "socket", nil ], "/socket"
      assert_pattern_match [ "/component", "component", nil, "socket", nil ], "/component/socket"
      assert_pattern_match [ "/directory", "index", nil, "socket", nil ], "/directory/socket"
      assert_pattern_match [ "/directory/component", "component", nil, "socket", nil ], "/directory/component/socket"
    end

    # Identifies a socket.io path with a session id.

    def test_application_with_socket
      assert_pattern_match [ "/", "index", nil, "websocket/session", nil ], "/websocket/session"
      assert_pattern_match [ "/component", "component", nil, "websocket/session", nil ], "/component/websocket/session"
      assert_pattern_match [ "/directory", "index", nil, "websocket/session", nil ], "/directory/websocket/session"
      assert_pattern_match [ "/directory/component", "component", nil, "websocket/session", nil ], "/directory/component/websocket/session"
    end

    # Identifies the path segments following the application as a path to client files.

    def test_application_with_public_path
      assert_pattern_match [ "/", "index", nil, nil, "file.ext" ], "/file.ext"
      assert_pattern_match [ "/component", "component", nil, nil, "file.ext" ], "/component/file.ext"
      assert_pattern_match [ "/directory", "index", nil, nil, "file.ext" ], "/directory/file.ext"
      assert_pattern_match [ "/directory/component", "component", nil, nil, "file.ext" ], "/directory/component/file.ext"
    end

    # Locates no application for a non-directory URL (no trailing slash).

    def test_application_session_as_file
      assert_pattern_match [ "/component", nil, "0000000000000000", nil, nil ], "/component/0000000000000000"
      assert_pattern_match [ "/directory", nil, "0000000000000000", nil, nil ], "/directory/0000000000000000"
      assert_pattern_match [ "/directory/component", nil, "0000000000000000", nil, nil ], "/directory/component/0000000000000000"
    end

    # Locates the application when specified as a directory URL (with a trailing slash).

    def test_application_session_as_directory
      assert_pattern_match [ "/", "index", "0000000000000000", nil, nil ], "/0000000000000000/"
      assert_pattern_match [ "/component", "component", "0000000000000000", nil, nil ], "/component/0000000000000000/"
      assert_pattern_match [ "/directory", "index", "0000000000000000", nil, nil ], "/directory/0000000000000000/"
      assert_pattern_match [ "/directory/component", "component", "0000000000000000", nil, nil ], "/directory/component/0000000000000000/"
    end

    # Identifies the socket path.

    def test_application_session_with_socket
      assert_pattern_match [ "/", "index", "0000000000000000", "socket", nil ], "/0000000000000000/socket"
      assert_pattern_match [ "/component", "component", "0000000000000000", "socket", nil ], "/component/0000000000000000/socket"
      assert_pattern_match [ "/directory", "index", "0000000000000000", "socket", nil ], "/directory/0000000000000000/socket"
      assert_pattern_match [ "/directory/component", "component", "0000000000000000", "socket", nil ], "/directory/component/0000000000000000/socket"
    end

    # Identifies a socket.io path with a session id.

    def test_application_with_socket
      assert_pattern_match [ "/", "index", "0000000000000000", "websocket/session", nil ], "/0000000000000000/websocket/session"
      assert_pattern_match [ "/component", "component", "0000000000000000", "websocket/session", nil ], "/component/0000000000000000/websocket/session"
      assert_pattern_match [ "/directory", "index", "0000000000000000", "websocket/session", nil ], "/directory/0000000000000000/websocket/session"
      assert_pattern_match [ "/directory/component", "component", "0000000000000000", "websocket/session", nil ], "/directory/component/0000000000000000/websocket/session"
    end

    # Identifies the path segments following the application as a path to client files.

    def test_application_session_with_public_path
      assert_pattern_match [ "/", "index", "0000000000000000", nil, "file.ext" ], "/0000000000000000/file.ext"
      assert_pattern_match [ "/component", "component", "0000000000000000", nil, "file.ext" ], "/component/0000000000000000/file.ext"
      assert_pattern_match [ "/directory", "index", "0000000000000000", nil, "file.ext" ], "/directory/0000000000000000/file.ext"
      assert_pattern_match [ "/directory/component", "component", "0000000000000000", nil, "file.ext" ], "/directory/component/0000000000000000/file.ext"
    end
    
   private
   
    def assert_pattern_match captures, path

      # Crack the path into its attributes and compare with the expected values.
    
      actual_captures = @application_pattern.match( path ).captures
      assert_equal captures, actual_captures

      # Reassemble the attributes into a path and compare with the original.

      actual_path = Server::ApplicationPattern.assemble( *actual_captures )
      assert_equal path, actual_path

    end

  end

end
