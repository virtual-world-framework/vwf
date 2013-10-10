# Copyright 2013 United States Government, as represented by the Secretary of Defense, Under
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

require_relative "../helper"
  
class PersistenceTest < MiniTest::Unit::TestCase
  include Rack::Test::Methods

  def app
    VWF
  end
  
  def setup
    @fake_public_path = "/test"
    @fake_application = "index.vwf"
    @fake_instance = "1234567890123456"
    @fake_second_instance = "6543210987654321"
    @fake_save = "testsave"
    @fake_second_save = "othersave"
    @fake_persistence_metadata = { }
    @fake_persistence_metadata[ "datatype" ] = "persistence"
    @fake_save_metadata = { }
    @fake_save_metadata[ "datatype" ] = "save"
    @fake_save_data = { }
    @fake_save_data[ "data" ] = "test"
  end
  
  
  def test_list_saves_no_directories
    clean_directory
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end
  
  def test_list_saves_just_public_path
    create_public_path
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end

  def test_list_saves_empty_application_directory
    create_application_path  
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end
  
  def test_list_saves_empty_instance_directory
    create_instance_path
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end
  
  def test_list_saves_empty_save_directory
    create_save_path
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end
  
  def test_list_saves_valid_save_directory
    create_save_path
    create_first_save
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil
    assert_equal_cleanup parsed_body[ @fake_instance ].length, 1
    assert_equal_cleanup @fake_save, parsed_body[ @fake_instance ][ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ @fake_instance ][ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    create_first_save_metadata
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( @fake_save_metadata, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil
    assert_equal_cleanup parsed_body[ @fake_instance ].length, 1
    assert_equal_cleanup @fake_save, parsed_body[ @fake_instance ][ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ @fake_instance ][ 0 ]["url"]
    assert_equal_cleanup( @fake_save_metadata, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    clean_directory
  end
  
  def test_list_saves_empty_both_save_directories
    create_both_save_paths
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( [], JSON.parse( last_response.body ) )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    assert_equal_cleanup( {}, JSON.parse( last_response.body ) )
    clean_directory
  end

  def test_list_saves_first_valid_second_empty
    create_both_save_paths
    create_first_save
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil
    assert_equal_cleanup parsed_body[ @fake_instance ].length, 1
    assert_equal_cleanup @fake_save, parsed_body[ @fake_instance ][ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ @fake_instance ][ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    create_first_save_metadata
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( @fake_save_metadata, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil
    assert_equal_cleanup parsed_body[ @fake_instance ].length, 1
    assert_equal_cleanup @fake_save, parsed_body[ @fake_instance ][ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/testsave", parsed_body[ @fake_instance ][ 0 ]["url"]
    assert_equal_cleanup( @fake_save_metadata, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    clean_directory
  end

  def test_list_saves_all_valid
    create_all_save_paths
    create_first_save
    create_second_save
    create_third_save
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 2, parsed_body.length
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ 0 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ 0 ][ "name" ], parsed_body[ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ 1 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ 1 ][ "name" ], parsed_body[ 1 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ 1 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 1 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 1 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 1 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 1 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/6543210987654321/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/6543210987654321/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "6543210987654321", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil    
    assert_equal_cleanup 2, parsed_body[ @fake_instance ].length
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ @fake_instance ][ 0 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ @fake_instance ][ 0 ][ "name" ], parsed_body[ @fake_instance ][ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ @fake_instance ][ 1 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ @fake_instance ][ 1 ][ "name" ], parsed_body[ @fake_instance ][ 1 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ @fake_instance ][ 1 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup parsed_body[ @fake_second_instance ] != nil
    assert_equal_cleanup 1, parsed_body[ @fake_second_instance ].length
    assert_equal_cleanup "http://example.org/test/index.vwf/6543210987654321/saves/testsave", parsed_body[ @fake_second_instance ][ 0 ]["url"]
    assert_equal_cleanup( {}, parsed_body[ @fake_second_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "6543210987654321", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    create_first_save_metadata
    create_first_persistence_metadata
    create_second_persistence_metadata
    get "/test/index.vwf/1234567890123456/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 2, parsed_body.length
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ 0 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ 0 ][ "name" ], parsed_body[ 0 ]["url"]
    if ( parsed_body[ 0 ][ "name" ] == @fake_save )
      assert_equal_cleanup( @fake_save_metadata, parsed_body[ 0 ]["metadata"] )
    else
      assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ 0 ]["metadata"] )
    end
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ 1 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ 1 ][ "name" ], parsed_body[ 1 ]["url"]
    if ( parsed_body[ 1 ][ "name" ] == @fake_save )
      assert_equal_cleanup( @fake_save_metadata, parsed_body[ 1 ]["metadata"] )
    else
      assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ 1 ]["metadata"] )
    end
    assert_equal_cleanup( "/test", parsed_body[ 1 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 1 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 1 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ 1 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/6543210987654321/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup 1, parsed_body.length
    assert_equal_cleanup @fake_save, parsed_body[ 0 ][ "name" ]
    assert_equal_cleanup "http://example.org/test/index.vwf/6543210987654321/saves/testsave", parsed_body[ 0 ]["url"]
    assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "6543210987654321", parsed_body[ 0 ][ "vwf_info" ][ "instance" ] )
    get "/test/index.vwf/saves"
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_cleanup parsed_body[ @fake_instance ] != nil    
    assert_equal_cleanup 2, parsed_body[ @fake_instance ].length
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ @fake_instance ][ 0 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ @fake_instance ][ 0 ][ "name" ], parsed_body[ @fake_instance ][ 0 ]["url"]
    if ( parsed_body[ @fake_instance ][ 0 ][ "name" ] == @fake_save )
      assert_equal_cleanup( @fake_save_metadata, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    else
      assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ @fake_instance ][ 0 ]["metadata"] )
    end
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup [ @fake_save, @fake_second_save ].include?( parsed_body[ @fake_instance ][ 1 ][ "name" ] )
    assert_equal_cleanup "http://example.org/test/index.vwf/1234567890123456/saves/" + parsed_body[ @fake_instance ][ 1 ][ "name" ], parsed_body[ @fake_instance ][ 1 ]["url"]
    if ( parsed_body[ @fake_instance ][ 1 ][ "name" ] == @fake_save )
      assert_equal_cleanup( @fake_save_metadata, parsed_body[ @fake_instance ][ 1 ]["metadata"] )
    else
      assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ @fake_instance ][ 1 ]["metadata"] )
    end
    assert_equal_cleanup( "/test", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "1234567890123456", parsed_body[ @fake_instance ][ 1 ][ "vwf_info" ][ "instance" ] )
    assert_cleanup parsed_body[ @fake_second_instance ] != nil
    assert_equal_cleanup 1, parsed_body[ @fake_second_instance ].length
    assert_equal_cleanup "http://example.org/test/index.vwf/6543210987654321/saves/testsave", parsed_body[ @fake_second_instance ][ 0 ]["url"]
    assert_equal_cleanup( @fake_persistence_metadata, parsed_body[ @fake_second_instance ][ 0 ]["metadata"] )
    assert_equal_cleanup( "/test", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "public_path" ] )
    assert_equal_cleanup( "index.vwf", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "application" ] )
    assert_equal_cleanup( "/test/index.vwf", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "path_to_application" ] )
    assert_equal_cleanup( "6543210987654321", parsed_body[ @fake_second_instance ][ 0 ][ "vwf_info" ][ "instance" ] )
    clean_directory
  end
  
  
  def test_list_instances_none
    get "/test/index.vwf/instances"    
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup( [ ], parsed_body )
  end

  def test_list_instances_one_with_save_only
    create_save_path
    create_first_save
    get "/test/index.vwf/instances"    
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup( [ { "instance_id" => "1234567890123456", "url" => "http://example.org/test/index.vwf/1234567890123456", "active" => false, "vwf_info" => { "public_path" => "/test", "application" => "index.vwf", "path_to_application" => "/test/index.vwf", "instance" => "1234567890123456" }, "metadata" => { } } ], parsed_body )
    clean_directory
  end
  
  def test_list_instances_one_without_metadata
    create_instance_path
    create_first_persistence_state
    get "/test/index.vwf/instances"    
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup( [ { "instance_id" => "1234567890123456", "url" => "http://example.org/test/index.vwf/1234567890123456", "active" => false, "vwf_info" => { "public_path" => "/test", "application" => "index.vwf", "path_to_application" => "/test/index.vwf", "instance" => "1234567890123456" }, "metadata" => { } } ], parsed_body )
    clean_directory
  end
  
  def test_list_instances_one_with_metadata
    create_instance_path
    create_first_persistence_state
    create_first_persistence_metadata
    get "/test/index.vwf/instances"    
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup( [ { "instance_id" => "1234567890123456", "url" => "http://example.org/test/index.vwf/1234567890123456", "active" => false, "vwf_info" => { "public_path" => "/test", "application" => "index.vwf", "path_to_application" => "/test/index.vwf", "instance" => "1234567890123456" }, "metadata" => { "datatype" => "persistence" } } ], parsed_body )
    clean_directory
  end
  
  def test_list_instances_with_two
    create_both_instance_paths
    create_first_persistence_state
    create_first_persistence_metadata
    create_second_persistence_state
    get "/test/index.vwf/instances"    
    assert_cleanup last_response.ok?
    parsed_body = JSON.parse( last_response.body )
    assert_equal_cleanup( [ { "instance_id" => "1234567890123456", "url" => "http://example.org/test/index.vwf/1234567890123456", "active" => false, "vwf_info" => { "public_path" => "/test", "application" => "index.vwf", "path_to_application" => "/test/index.vwf", "instance" => "1234567890123456" }, "metadata" => { "datatype" => "persistence" } }, { "instance_id" => "6543210987654321", "url" => "http://example.org/test/index.vwf/6543210987654321", "active" => false, "vwf_info" => { "public_path" => "/test", "application" => "index.vwf", "path_to_application" => "/test/index.vwf", "instance" => "6543210987654321" }, "metadata" => { } } ], parsed_body )
    clean_directory
  end
  
  

   

  private
  def create_public_path
    clean_directory
    FileUtils.mkdir_p "documents" + @fake_public_path
  end
  def create_application_path
    create_public_path
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application
  end
  def create_instance_path
    create_application_path
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance
  end
  def create_save_path
    create_instance_path
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_save
  end
  def create_both_save_paths
    create_save_path
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_second_save
  end
  def create_both_instance_paths
    create_instance_path
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance
  end
  def create_all_save_paths
    create_both_instance_paths
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_save
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_second_save
    FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance + "/save_" + @fake_save
  end
  
  def create_first_save
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_save + "/saveState.vwf.json", 'w')
    save_file.puts @fake_save_data.to_json
    save_file.close
  end
  def create_first_save_metadata
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_save + "/metadata.json", 'w')
    save_file.puts @fake_save_metadata.to_json
    save_file.close
  end
  def create_second_save
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_second_save + "/saveState.vwf.json", 'w')
    save_file.puts @fake_save_data.to_json
    save_file.close
  end
  def create_second_save_metadata
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/save_" + @fake_second_save + "/metadata.json", 'w')
    save_file.puts @fake_save_metadata.to_json
    save_file.close
  end
  def create_third_save
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance + "/save_" + @fake_save + "/saveState.vwf.json", 'w')
    save_file.puts @fake_save_data.to_json
    save_file.close
  end
  def create_third_save_metadata
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance + "/save_" + @fake_save + "/metadata.json", 'w')
    save_file.puts @fake_save_metadata.to_json
    save_file.close
  end
  
  def create_first_persistence_state
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/persistenceState.vwf.json", 'w')
    save_file.puts @fake_save_data.to_json
    save_file.close
  end
  def create_first_persistence_metadata
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_instance + "/metadata.json", 'w')
    save_file.puts @fake_persistence_metadata.to_json
    save_file.close
  end
  def create_second_persistence_state
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance + "/persistenceState.vwf.json", 'w')
    save_file.puts @fake_save_data.to_json
    save_file.close
  end
  def create_second_persistence_metadata
    save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + @fake_second_instance + "/metadata.json", 'w')
    save_file.puts @fake_persistence_metadata.to_json
    save_file.close
  end
  
  def clean_directory
    FileUtils.rm_r "documents" + @fake_public_path, :force => true  
  end
  
  def assert_equal_cleanup( valueone, valuetwo )
    if ( valueone != valuetwo )
      clean_directory
    end
    assert_equal valueone, valuetwo
  end
  
  def assert_cleanup( value )
    if not value
      clean_directory
    end
    assert value
  end

end