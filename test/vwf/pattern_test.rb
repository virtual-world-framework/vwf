# Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
# Secretary of Defense (Personnel & Readiness).
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

require "helper"
  
class VWF::PatternTest < MiniTest::Unit::TestCase
  include Rack::Test::Methods

  # Assume these directories containing these files.

  MOCK_FILESYSTEM =
  {
    "/" =>                [ "index.vwf", "component.vwf" ],
    "/directory" =>       [ "index.vwf", "component.vwf" ],
  }

  def setup
    @application_pattern = VWF::Pattern.new
    @application_pattern.mock_filesystem = MOCK_FILESYSTEM
  end

  # Locates the index application at the root.

  def test_root_with_index
    assert_pattern_match [ "/", "index.vwf", nil, nil, nil, nil ], "/"
  end

  # Locates a named application at the root.

  def test_root_file
    assert_pattern_match [ "/", "component.vwf", nil, nil, nil, nil ], "/component.vwf/"
  end

  # Locates the index application in a directory.

  def test_directory_with_index
    assert_pattern_match [ "/directory", "index.vwf", nil, nil, nil, nil ], "/directory/"
  end
    
  # Locates a named application in a directory.

  def test_file
    assert_pattern_match [ "/directory", "component.vwf", nil, nil, nil, nil ], "/directory/component.vwf/"
  end
    
  # Locates no application for a non-directory URL (no trailing slash).
# TODO: fix comment
  def test_application_as_file
    assert_pattern_match [ "/", "component.vwf", nil, nil, nil, nil ], "/component.vwf"
    assert_pattern_match [ "/directory", "index.vwf", nil, nil, nil, nil ], "/directory"
    assert_pattern_match [ "/directory", "component.vwf", nil, nil, nil, nil ], "/directory/component.vwf"
  end

  # Locates the application when specified as a directory URL (with a trailing slash).

  def test_application_as_directory
    assert_pattern_match [ "/", "index.vwf", nil, nil, nil, nil ], "/"
    assert_pattern_match [ "/", "component.vwf", nil, nil, nil, nil ], "/component.vwf/"
    assert_pattern_match [ "/directory", "index.vwf", nil, nil, nil, nil ], "/directory/"
    assert_pattern_match [ "/directory", "component.vwf", nil, nil, nil, nil ], "/directory/component.vwf/"
  end

  # Identifies the socket path.

  def test_application_with_socket
    assert_pattern_match [ "/", "index.vwf", nil, "socket", nil, nil ], "/socket"
    assert_pattern_match [ "/", "component.vwf", nil, "socket", nil, nil ], "/component.vwf/socket"
    assert_pattern_match [ "/directory", "index.vwf", nil, "socket", nil, nil ], "/directory/socket"
    assert_pattern_match [ "/directory", "component.vwf", nil, "socket", nil, nil ], "/directory/component.vwf/socket"
  end

  # Identifies a socket.io path with a session id.

  def test_application_with_socket_and_session
    assert_pattern_match [ "/", "index.vwf", nil, "websocket/session", nil, nil ], "/websocket/session"
    assert_pattern_match [ "/", "component.vwf", nil, "websocket/session", nil, nil ], "/component.vwf/websocket/session"
    assert_pattern_match [ "/directory", "index.vwf", nil, "websocket/session", nil, nil ], "/directory/websocket/session"
    assert_pattern_match [ "/directory", "component.vwf", nil, "websocket/session", nil, nil ], "/directory/component.vwf/websocket/session"
  end

  # Identifies the path segments following the application as a path to client files.
# TODO: fix method name
  def test_application_with_public_path
    assert_pattern_match [ "/", "index.vwf", nil, "file.ext", nil, nil ], "/file.ext"
    assert_pattern_match [ "/", "component.vwf", nil, "file.ext", nil, nil ], "/component.vwf/file.ext"
    assert_pattern_match [ "/directory", "index.vwf", nil, "file.ext", nil, nil ], "/directory/file.ext"
    assert_pattern_match [ "/directory", "component.vwf", nil, "file.ext", nil, nil ], "/directory/component.vwf/file.ext"
  end

  # Locates no application for a non-directory URL (no trailing slash).
# TODO: fix comment
  def test_application_session_as_file
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", nil, nil, nil ], "/component.vwf/0000000000000000"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", nil, nil, nil ], "/directory/0000000000000000"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", nil, nil, nil ], "/directory/component.vwf/0000000000000000"
  end

  # Locates the application when specified as a directory URL (with a trailing slash).

  def test_application_session_as_directory
    assert_pattern_match [ "/", "index.vwf", "0000000000000000", nil, nil, nil ], "/0000000000000000/"
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", nil, nil, nil ], "/component.vwf/0000000000000000/"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", nil, nil, nil ], "/directory/0000000000000000/"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", nil, nil, nil ], "/directory/component.vwf/0000000000000000/"
  end

  # Identifies the socket path.

  def test_application_session_with_socket
    assert_pattern_match [ "/", "index.vwf", "0000000000000000", "socket", nil, nil ], "/0000000000000000/socket"
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", "socket", nil, nil ], "/component.vwf/0000000000000000/socket"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", "socket", nil, nil ], "/directory/0000000000000000/socket"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", "socket", nil, nil ], "/directory/component.vwf/0000000000000000/socket"
  end

  # Identifies a socket.io path with a session id.

  def test_application_with_socket_and_session
    assert_pattern_match [ "/", "index.vwf", "0000000000000000", "websocket/session", nil, nil ], "/0000000000000000/websocket/session"
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", "websocket/session", nil, nil ], "/component.vwf/0000000000000000/websocket/session"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", "websocket/session", nil, nil ], "/directory/0000000000000000/websocket/session"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", "websocket/session", nil, nil ], "/directory/component.vwf/0000000000000000/websocket/session"
  end

  # Identifies the path segments following the application as a path to client files.
# TODO: fix comment
  def test_application_session_with_public_path
    assert_pattern_match [ "/", "index.vwf", "0000000000000000", "file.ext", nil, nil ], "/0000000000000000/file.ext"
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", "file.ext", nil, nil ], "/component.vwf/0000000000000000/file.ext"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", "file.ext", nil, nil ], "/directory/0000000000000000/file.ext"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", "file.ext", nil, nil ], "/directory/component.vwf/0000000000000000/file.ext"
  end
  
  def test_application_load
    assert_pattern_match [ "/", "component.vwf", "0000000000000000", nil, "file", nil ], "/component.vwf/load/file/0000000000000000/"
    assert_pattern_match [ "/directory", "index.vwf", "0000000000000000", nil, "file", nil ], "/directory/load/file/0000000000000000/"
    assert_pattern_match [ "/directory", "component.vwf", "0000000000000000", nil, "file", nil ], "/directory/component.vwf/load/file/0000000000000000/"
  end
    
  private
   
  def assert_pattern_match captures, path

    # Crack the path into its attributes and compare with the expected values.
    
    actual_captures = @application_pattern.match( path ).captures
    assert_equal captures, actual_captures

    # Reassemble the attributes into a path and compare with the original.

    # actual_path = VWF::Pattern.assemble( *actual_captures )
    # assert_equal path, actual_path

  end

end
