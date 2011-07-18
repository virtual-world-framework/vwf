require "helper"

class ServerTest
  
  class ApplicationPatternTest < Test::Unit::TestCase
    include Rack::Test::Methods

    # MOCK_FILESYSTEM =
    # {
    #   "/" =>                [ "index.yaml", "component.yaml" ],
    #   "/directory" =>       [ "index.yaml", "component.yaml" ]
    # }

    def setup
      @application_pattern = Server::ApplicationPattern.new
      # @application_pattern.mock_filesystem = MOCK_FILESYSTEM
    end

    def test_root_with_index
      assert_equal [ "/", nil, "index.yaml", nil, nil ], @application_pattern.match( "/" ).captures
    end

    def test_root_file
      assert_equal [ "/component", nil, "component.yaml", nil, nil ], @application_pattern.match( "/component" ).captures
    end

    def test_directory_with_index
      assert_equal [ "/directory", nil, "index.yaml", nil, nil ], @application_pattern.match( "/directory" ).captures
    end
    
    def test_file
      assert_equal [ "/directory/component", nil, "component.yaml", nil, nil ], @application_pattern.match( "/directory/component" ).captures
    end
    
    def test_root_with_session
      assert_equal [ "/", "/session/something-else", "index.yaml", nil, nil ], @application_pattern.match( "/session/something-else" ).captures
    end

    def test_applications_as_directories
      assert_equal_paths [ "/", nil ], @application_pattern.match( "/" ).captures
      assert_equal_paths [ "/component/", nil ], @application_pattern.match( "/component/" ).captures
      assert_equal_paths [ "/directory/", nil ], @application_pattern.match( "/directory/" ).captures
      assert_equal_paths [ "/directory/component/", nil ], @application_pattern.match( "/directory/component/" ).captures
    end

    def test_applications_as_files
      assert_equal_paths [ "/component", nil ], @application_pattern.match( "/component" ).captures
      assert_equal_paths [ "/directory", nil ], @application_pattern.match( "/directory" ).captures
      assert_equal_paths [ "/directory/component", nil ], @application_pattern.match( "/directory/component" ).captures
    end

    def test_applications_with_publc_path
      assert_equal_paths [ "/", "/file.ext" ], @application_pattern.match( "/file.ext" ).captures
      assert_equal_paths [ "/component/", "/file.ext" ], @application_pattern.match( "/component/file.ext" ).captures
      assert_equal_paths [ "/directory/", "/file.ext" ], @application_pattern.match( "/directory/file.ext" ).captures
      assert_equal_paths [ "/directory/component/", "/file.ext" ], @application_pattern.match( "/directory/component/file.ext" ).captures
    end

  private

    def assert_equal_paths expected_paths, captures
      expected_application_path, expected_public_path = expected_paths
      actual_application_path, actual_public_path = captures
      assert_equal expected_application_path, actual_application_path
      assert_equal expected_public_path, actual_public_path
    end

  end

end
