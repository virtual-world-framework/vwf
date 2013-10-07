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

require "helper"
  
class VWF::StorageTest < MiniTest::Unit::TestCase

  def setup
    @storage_fs = VWF::StorageFS.new()
    @fake_public_path = "/fakeapp"
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
  
  

  def test_list_application_instances_no_directories
    clean_directory
    assert_equal_cleanup [ ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_just_public_path
    create_public_path
  assert_equal_cleanup [ ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
  clean_directory
  end

  def test_list_application_instances_empty_application_directory
    create_application_path  
    assert_equal_cleanup [ ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_empty_instance_directory
    create_instance_path
    assert_equal_cleanup [ ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_first_instance_directory
    create_instance_path
    create_first_persistence_state
    assert_equal_cleanup [ @fake_instance ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_empty_both_instance_directories
    create_both_instance_paths
    assert_equal_cleanup [ ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_first_valid_second_empty
    create_both_instance_paths
    create_first_persistence_state
    assert_equal_cleanup [ @fake_instance ], @storage_fs.list_application_instances( @fake_public_path, @fake_application )
    clean_directory
  end
  
  def test_list_application_instances_both_valid
    create_both_instance_paths
    create_first_persistence_state
    create_second_persistence_state
    assert_equal_cleanup [ @fake_instance, @fake_second_instance ].sort, @storage_fs.list_application_instances( @fake_public_path, @fake_application ).sort
    clean_directory
  end
  


  def test_get_instance_metadata_no_directories
    clean_directory
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_get_instance_metadata_just_public_path
    create_public_path
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_get_instance_metadata_empty_application_directory
    create_application_path  
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_instance_metadata_empty_instance_directory
    create_instance_path
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_instance_metadata_first_instance_directory
    create_instance_path
    create_first_persistence_metadata
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_instance_metadata_empty_both_instance_directories
    create_both_instance_paths
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_get_instance_metadata_first_valid_second_empty
    create_both_instance_paths
    create_first_persistence_metadata
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_get_instance_metadata_both_valid
    create_both_instance_paths
    create_first_persistence_metadata
    create_second_persistence_metadata
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  

  def test_set_instance_metadata_no_directories
    clean_directory
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_set_instance_metadata_just_public_path
    create_public_path
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_set_instance_metadata_empty_application_directory
    create_application_path  
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_instance_metadata_empty_instance_directory
    create_instance_path
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_instance_metadata_first_instance_directory
    create_instance_path
    create_first_persistence_metadata
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save_metadata )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_instance_metadata_first_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_set_instance_metadata_both_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
    @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_persistence_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end

  
  
  def test_get_persistence_state_no_directories
    clean_directory
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_get_persistence_state_just_public_path
    create_public_path
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_get_persistence_state_empty_application_directory
    create_application_path  
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_persistence_state_empty_instance_directory
    create_instance_path
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_persistence_state_first_instance_directory
    create_instance_path
    create_first_persistence_state
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_get_persistence_state_empty_both_instance_directories
    create_both_instance_paths
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end

  def test_get_persistence_state_first_valid_second_empty
    create_both_instance_paths
    create_first_persistence_state
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end

  def test_get_persistence_state_both_valid
    create_both_instance_paths
    create_first_persistence_state
    create_second_persistence_state
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  
  
  def test_set_persistence_state_with_metadata_no_directories
    clean_directory
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_no_directories
    clean_directory
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_set_persistence_state_with_metadata_just_public_path
    create_public_path
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_just_public_path
    create_public_path
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_set_persistence_state_with_metadata_empty_application_directory
    create_application_path  
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_empty_application_directory
    create_application_path  
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_with_metadata_empty_instance_directory
    create_instance_path
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_empty_instance_directory
    create_instance_path
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_with_metadata_first_instance_directory
    create_instance_path
    create_first_persistence_state
    create_first_persistence_metadata
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata, @fake_save_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_first_instance_directory
    create_instance_path
    create_first_persistence_state
    create_first_persistence_metadata
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata, nil )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_set_persistence_state_with_metadata_first_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_first_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_set_persistence_state_with_metadata_both_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, @fake_persistence_metadata )
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  def test_set_persistence_state_without_metadata_both_valid_second_empty
    create_both_instance_paths
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_save_data, nil )
    @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance )
    assert_equal_cleanup nil, @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance )
    clean_directory
  end
  
  
  
  def test_list_instance_save_states_no_directories
    clean_directory
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_list_instance_save_states_just_public_path
    create_public_path
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_list_instance_save_states_empty_application_directory
    create_application_path  
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_list_instance_save_states_empty_instance_directory
    create_instance_path
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_list_instance_save_states_empty_save_directory
    create_save_path
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_list_instance_save_states_valid_save_directory
    create_save_path
    create_first_save
    assert_equal_cleanup [ @fake_save ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end
  
  def test_list_instance_save_states_empty_both_save_directories
    create_both_save_paths
    assert_equal_cleanup [ ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
  end

  def test_list_instance_save_states_first_valid_second_empty
    create_both_save_paths
    create_first_save
    assert_equal_cleanup [ @fake_save ], @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance )
    clean_directory
  end

  def test_list_instance_save_states_both_valid
    create_both_save_paths
    create_first_save
    create_second_save
    assert_equal_cleanup [ @fake_save, @fake_second_save ].sort, @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).sort
    clean_directory
  end
  
  
  
  def test_list_application_save_states_no_directories
    clean_directory
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end

  def test_list_application_save_states_just_public_path
    create_public_path
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end

  def test_list_application_save_states_empty_application_directory
    create_application_path  
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_empty_instance_directory
    create_instance_path
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_empty_save_directory
    create_save_path
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_valid_save_directory
    create_save_path
    create_first_save
    assert_equal_cleanup( { @fake_instance => [ @fake_save ] }, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_empty_both_save_directories
    create_both_save_paths
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
  end

  def test_list_application_save_states_first_valid_second_empty
    create_both_save_paths
    create_first_save
    assert_equal_cleanup( { @fake_instance => [ @fake_save ] }, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end

  def test_list_application_save_states_both_valid
    create_both_save_paths
    create_first_save
    create_second_save
    assert_equal_cleanup( { @fake_instance => [ @fake_save, @fake_second_save ].sort }, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_both_instance_paths_empty
    create_both_instance_paths
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_all_save_paths_empty
    create_all_save_paths
    assert_equal_cleanup( {}, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  def test_list_application_save_states_all_save_paths_empty
    create_all_save_paths
    create_first_save
    create_second_save
    create_third_save
    assert_equal_cleanup( { @fake_instance => [ @fake_save, @fake_second_save ].sort, @fake_second_instance => [ @fake_save ] }, @storage_fs.list_application_save_states( @fake_public_path, @fake_application ) )
    clean_directory
  end
  
  
  
  def test_get_save_metadata_no_directories
    clean_directory
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_get_save_metadata_just_public_path
    create_public_path
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_get_save_metadata_empty_application_directory
    create_application_path  
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_empty_instance_directory
    create_instance_path
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_empty_save_directory
    create_save_path
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_first_instance_directory
    create_save_path
    create_first_save_metadata
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_first_instance_directory_from_instance
    create_save_path
    create_first_persistence_metadata
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_empty_all_save_directories
    create_all_save_paths
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_first_valid_second_empty
    create_all_save_paths
    create_first_save_metadata
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_metadata_all_valid
    create_all_save_paths
    create_first_save_metadata
    create_second_save_metadata
    create_third_save_metadata
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  

  def test_get_save_state_no_directories
    clean_directory
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_get_save_state_just_public_path
    create_public_path
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_get_save_state_empty_application_directory
    create_application_path  
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_empty_instance_directory
    create_instance_path
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_empty_save_directory
    create_save_path
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_first_instance_directory
    create_save_path
    create_first_save
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_empty_all_save_directories
    create_all_save_paths
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_first_valid_second_empty
    create_all_save_paths
    create_first_save
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_get_save_state_all_valid
    create_all_save_paths
    create_first_save
    create_second_save
    create_third_save
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  
  
  def test_set_save_state_with_metadata_no_directories
    clean_directory
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_save_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_no_directories
    clean_directory
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_set_save_state_with_metadata_just_public_path
    create_public_path
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_save_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_just_public_path
    create_public_path
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end

  def test_set_save_state_with_metadata_empty_application_directory
    create_application_path  
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_save_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_empty_application_directory
    create_application_path  
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_with_metadata_empty_instance_directory
    create_instance_path
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_save_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_empty_instance_directory
    create_instance_path
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_with_metadata_first_instance_directory
    create_save_path
    create_first_save
    create_first_save_metadata
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_persistence_metadata, @fake_save_metadata )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_first_instance_directory
    create_save_path
    create_first_save
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_persistence_metadata, nil )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_with_metadata_first_valid_second_empty
    create_all_save_paths
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_first_valid_second_empty
    create_all_save_paths
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_with_metadata_both_valid_second_empty
    create_all_save_paths
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, @fake_persistence_metadata )
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save, @fake_save_data, @fake_persistence_metadata )
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save, @fake_save_data, @fake_persistence_metadata )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    assert_equal_cleanup @fake_persistence_metadata, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    clean_directory
  end
  
  def test_set_save_state_without_metadata_both_valid_second_empty
    create_all_save_paths
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_save_data, nil )
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save, @fake_save_data, nil )
    @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save, @fake_save_data, nil )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save )
    assert_equal_cleanup @fake_save_data, @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
    assert_equal_cleanup nil, @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_save )
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

end