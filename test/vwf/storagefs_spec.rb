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

describe VWF::StorageFS do
  before do
    @storage_fs = VWF::StorageFS.new()
    @fake_public_path = "/fakeapp"
    @fake_application = "index.vwf"

    @fake_instance = "1234567890123456"
    @fake_second_instance = "6543210987654321"

    clean_directory
  end

  after do
    clean_directory
  end

  describe ".list_application_instances" do
    before do
      @fake_state = { "state" => "instance" }
    end

    it "returns nothing when directory is empty" do
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end

    it "does not return empty public directories" do
      create_public_path
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end
    
    it "does not return empty application directories" do
      create_application_path
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end
    
    it "does not return an empty instance directory" do
      create_instance_path( @fake_instance )
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end

    it "returns a valid instance" do
      create_instance_persistence_state( @fake_instance, @fake_state )
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ @fake_instance ]
    end

    it "returns multiple valid instances sorted" do
      create_instance_persistence_state( @fake_instance, @fake_state )
      create_instance_persistence_state( @fake_second_instance, @fake_state )
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ @fake_instance, @fake_second_instance ].sort
    end
    
    it "returns only a valid instance given one valid and one invalid instance" do
      create_instance_persistence_state( @fake_instance, @fake_state )
      create_instance_path( @fake_second_instance )
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ @fake_instance ]
    end
  end

  describe ".get_instance_metadata" do
    before do
      @fake_persistence_metadata = { "datatype" => "persistence" }
      @fake_second_persistence_metadata = { "datatype" => "persistence2" }
    end

    it "returns nothing when directory is empty" do
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end

    it "does not return public directories" do
      create_public_path
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "does not return application directories" do
      create_application_path
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "does not return when instance directories are empty" do
      create_instance_path( @fake_instance )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end

    it "returns a valid metadata hash" do
      create_instance_persistence_metadata( @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end

    it "returns correct metadata for correct instance with two valid instances" do
      create_instance_persistence_metadata( @fake_instance, @fake_persistence_metadata )
      create_instance_persistence_metadata( @fake_second_instance, @fake_second_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance ).must_equal @fake_second_persistence_metadata
    end
  end
  
  describe ".set_instance_metadata" do
    before do
      @fake_persistence_metadata = { "datatype" => "persistence" }
      @fake_initial_persistence_metadata = { "datatype" => "persistence_initial" }
      @fake_second_persistence_metadata = { "datatype" => "persistence2" }
    end
    
    it "properly sets metadata when directory is empty" do
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets metadata when public directory is empty" do
      create_public_path
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets metadata when application directory is empty" do
      create_application_path
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets metadata when the instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly overwrites an existing metadata if one already exists" do
      create_instance_persistence_metadata( @fake_instance, @fake_initial_persistence_metadata )
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly writes two separate instance metadatas" do
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_metadata )
      @storage_fs.set_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance, @fake_second_persistence_metadata )
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance ).must_equal @fake_second_persistence_metadata
    end
  end
  
  describe ".get_persistence_state" do
    before do
      @fake_persistence_state= { "state" => "instance" }
      @fake_second_persistence_state = { "state" => "instance2" }
    end

    it "returns nothing when directory is empty" do
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end

    it "does not return public directories" do
      create_public_path
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "does not return application directories" do
      create_application_path
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "does not return when instance directories are empty" do
      create_instance_path( @fake_instance )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end

    it "returns a valid state" do
      create_instance_persistence_state( @fake_instance, @fake_persistence_state )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
    end

    it "returns correct state for correct instance with two valid instances" do
      create_instance_persistence_state( @fake_instance, @fake_persistence_state )
      create_instance_persistence_state( @fake_second_instance, @fake_second_persistence_state )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance ).must_equal @fake_second_persistence_state
    end
  end
  
  describe ".set_persistence_state" do
    before do
      @fake_persistence_state = { "state" => "instance" }
      @fake_initial_persistence_state= { "state" => "instance_initial" }
      @fake_second_persistence_state = { "state" => "instance2" }
      @fake_persistence_metadata = { "datatype" => "persistence" }
      @fake_initial_persistence_metadata = { "datatype" => "persistence_initial" }
      @fake_second_persistence_metadata = { "datatype" => "persistence2" }
    end
    
    it "properly sets state without metadata when directory is empty" do
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, nil )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "properly sets state with metadata when directory is empty" do
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets state without metadata when public directory is empty" do
      create_public_path
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, nil )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "properly sets state with metadata when public directory is empty" do
      create_public_path
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets state without metadata when application directory is empty" do
      create_application_path
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, nil )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "properly sets state with metadata when application directory is empty" do
      create_application_path
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly sets state without metadata when the instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, nil )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal nil
    end
    
    it "properly sets state with metadata when the instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly overwrites existing state but not metadata if called with no metadata" do
      create_instance_persistence_state( @fake_instance, @fake_initial_persistence_state )
      create_instance_persistence_metadata( @fake_instance, @fake_initial_persistence_metadata )
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, nil )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_initial_persistence_metadata
    end
    
     it "properly overwrites existing state and metadata if called with metadata" do
      create_instance_persistence_state( @fake_instance, @fake_initial_persistence_state )
      create_instance_persistence_state( @fake_instance, @fake_initial_persistence_metadata )
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
    end
    
    it "properly writes two separate instance states with metadata" do
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_instance, @fake_persistence_state, @fake_persistence_metadata )
      @storage_fs.set_persistence_state( @fake_public_path, @fake_application, @fake_second_instance, @fake_second_persistence_state, @fake_second_persistence_metadata )
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_instance ).must_equal @fake_persistence_metadata
      @storage_fs.get_persistence_state( @fake_public_path, @fake_application, @fake_second_instance ).must_equal @fake_second_persistence_state
      @storage_fs.get_instance_metadata( @fake_public_path, @fake_application, @fake_second_instance ).must_equal @fake_second_persistence_metadata
    end
  end
  
  describe ".list_instance_save_states" do
    before do
      @fake_save = "testSaveOne"
      @fake_second_save = "testSaveTwo"
      @fake_state = { "state" => "instance" }
    end

    it "returns nothing when directory is empty" do
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ ]
    end

    it "does not return empty public directories" do
      create_public_path
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ ]
    end
    
    it "does not return empty application directories" do
      create_application_path
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ ]
    end
    
    it "does not return an empty instance directory" do
      create_instance_path( @fake_instance )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ ]
    end
    
    it "does not return an empty save directory" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ ]
    end

    it "returns a valid save" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ @fake_save ]
    end

    it "returns multiple valid saves sorted" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_state( @fake_instance, @fake_second_save, @fake_state )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ @fake_save, @fake_second_save ].sort
    end
    
    it "returns only a valid save given one valid and one invalid save" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_path( @fake_instance, @fake_second_save )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ @fake_save ]
    end
    
    it "returns only the valid save for the designated instance given two instances with one valid save each" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_state( @fake_second_instance, @fake_second_save, @fake_state )
      @storage_fs.list_instance_save_states( @fake_public_path, @fake_application, @fake_instance ).must_equal [ @fake_save ]
    end
  end
  
  describe ".list_application_save_states" do
    before do
      @fake_save = "testSaveOne"
      @fake_second_save = "testSaveTwo"
      @fake_state = { "state" => "instance" }
    end

    it "returns empty hash when directory is empty" do
      expected_result = {}
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { } )
    end

    it "returns empty hash when public directory is empty" do
      create_public_path
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { } )
    end
    
    it "returns empty hash when application directory is empty" do
      create_application_path
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { } )
    end
    
    it "returns empty hash when instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { } )
    end
    
    it "returns empty hash when save directory is empty" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { } )
    end

    it "returns properly filled hash with single save in a single instance" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { @fake_instance => [ @fake_save ] } )
    end

    it "returns properly filled hash with multiple saves for single instance" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_state( @fake_instance, @fake_second_save, @fake_state )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { @fake_instance => [ @fake_save, @fake_second_save ].sort } )
    end
    
    it "returns properly filled hash given one valid and one invalid save within one instance" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_path( @fake_instance, @fake_second_save )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { @fake_instance => [ @fake_save ] } )
    end
    
    it "returns properly filled hash given multiple instances with multiple saves each" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_state( @fake_instance, @fake_second_save, @fake_state )
      create_save_state( @fake_second_instance, @fake_save, @fake_state )
      create_save_state( @fake_second_instance, @fake_second_save, @fake_state )
      @storage_fs.list_application_save_states( @fake_public_path, @fake_application ).must_equal( { @fake_instance => [ @fake_save, @fake_second_save ].sort, @fake_second_instance => [ @fake_save, @fake_second_save ].sort } )
    end
  end
  
  describe ".get_save_metadata" do
    before do
      @fake_persistence_metadata = { "datatype" => "persistence" }
      @fake_save_metadata = { "datatype" => "save" }
      @fake_second_save_metadata = { "datatype" => "save2" }
      @fake_save = "testSaveOne"
      @fake_second_save = "testSaveTwo"
    end

    it "returns nothing when directory is empty" do
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end

    it "does not return public directories" do
      create_public_path
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return application directories" do
      create_application_path
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return when instance directories are empty" do
      create_instance_path( @fake_instance )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return when save directory is empty" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end

    it "returns a valid metadata hash belonging to save" do
      create_save_metadata( @fake_instance, @fake_save, @fake_save_metadata )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end

    it "returns save metadata hash belonging to save when save and instance possess metadata" do
      create_instance_persistence_metadata( @fake_instance, @fake_persistence_metadata )
      create_save_metadata( @fake_instance, @fake_save, @fake_save_metadata )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "returns save metadata hash belonging to instance when only the instance possesses metadata" do
      create_instance_persistence_metadata( @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_persistence_metadata
    end

    it "returns correct metadata for correct save with two valid saves" do
      create_save_metadata( @fake_instance, @fake_save, @fake_save_metadata )
      create_save_metadata( @fake_instance, @fake_second_save, @fake_second_save_metadata )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save ).must_equal @fake_second_save_metadata
    end
    
    it "returns correct metadata for correct save with one valid save and the other defaulting correctly to instance metadata" do
      create_save_metadata( @fake_instance, @fake_save, @fake_save_metadata )
      create_instance_persistence_metadata( @fake_instance, @fake_persistence_metadata )
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save ).must_equal @fake_persistence_metadata
    end
  end
  
  describe ".get_save_state" do
    before do
      @fake_state = { "datatype" => "save" }
      @fake_second_state = { "datatype" => "save2" }
      @fake_save = "testSaveOne"
      @fake_second_save = "testSaveTwo"
    end

    it "returns nothing when directory is empty" do
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end

    it "does not return public directories" do
      create_public_path
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return application directories" do
      create_application_path
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return when instance directories are empty" do
      create_instance_path( @fake_instance )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "does not return when save directory is empty" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end

    it "returns a valid metadata hash belonging to save" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
    end
    
    it "returns correct metadata for correct save with two valid saves" do
      create_save_state( @fake_instance, @fake_save, @fake_state )
      create_save_state( @fake_instance, @fake_second_save, @fake_second_state )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save ).must_equal @fake_second_state
    end
  end
  
  describe ".set_save_state" do
    before do
      @fake_save = "testSaveOne"
      @fake_second_save = "testSaveTwo"
      @fake_state = { "state" => "save" }
      @fake_initial_state= { "state" => "save_initial" }
      @fake_second_state = { "state" => "save2" }
      @fake_save_metadata = { "datatype" => "save" }
      @fake_initial_save_metadata = { "datatype" => "save_initial" }
      @fake_second_save_metadata = { "datatype" => "save2" }
    end
    
    it "properly sets state without metadata when directory is empty" do
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "properly sets state with metadata when directory is empty" do
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly sets state without metadata when public directory is empty" do
      create_public_path
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "properly sets state with metadata when public directory is empty" do
      create_public_path
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly sets state without metadata when application directory is empty" do
      create_application_path
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "properly sets state with metadata when application directory is empty" do
      create_application_path
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly sets state without metadata when the instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "properly sets state with metadata when the instance directory is empty" do
      create_instance_path( @fake_instance )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly sets state without metadata when the save directory is empty" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal nil
    end
    
    it "properly sets state with metadata when the save directory is empty" do
      create_save_path( @fake_instance, @fake_save )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly overwrites existing state but not metadata if called with no metadata" do
      create_save_state( @fake_instance, @fake_save, @fake_initial_state )
      create_save_metadata( @fake_instance, @fake_save, @fake_initial_save_metadata )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, nil )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_initial_save_metadata
    end
    
     it "properly overwrites existing state and metadata if called with metadata" do
      create_save_state( @fake_instance, @fake_save, @fake_initial_state )
      create_save_metadata( @fake_instance, @fake_save, @fake_initial_save_metadata )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
    end
    
    it "properly writes two separate instance states with metadata" do
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save, @fake_state, @fake_save_metadata )
      @storage_fs.set_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save, @fake_second_state, @fake_second_save_metadata )
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_state
      @storage_fs.get_save_state( @fake_public_path, @fake_application, @fake_instance, @fake_second_save ).must_equal @fake_second_state
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_save ).must_equal @fake_save_metadata
      @storage_fs.get_save_metadata( @fake_public_path, @fake_application, @fake_instance, @fake_second_save ).must_equal @fake_second_save_metadata
    end
  end
end

def clean_directory
  FileUtils.rm_r "documents" + @fake_public_path, :force => true  
end

def create_public_path
  FileUtils.mkdir_p "documents" + @fake_public_path
end

def create_application_path
  FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application
end

def create_instance_path( fake_instance )
  FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance
end

def create_save_path( fake_instance, fake_save )
  FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/save_" + fake_save
end

def create_instance_persistence_state( fake_instance, fake_state )
  create_instance_path( fake_instance )
  save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/persistenceState.vwf.json", 'w')
  save_file.puts( fake_state.to_json )
  save_file.close
end

def create_instance_persistence_metadata( fake_instance, fake_metadata )
  create_instance_path( fake_instance )
  save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/metadata.json", 'w')
  save_file.puts( fake_metadata.to_json )
  save_file.close
end

def create_save_state( fake_instance, fake_save, fake_state )
  create_save_path( fake_instance, fake_save )
  save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/save_" + fake_save + "/saveState.vwf.json", 'w')
  save_file.puts( fake_state.to_json )
  save_file.close
end

def create_save_metadata( fake_instance, fake_save, fake_state )
  create_save_path( fake_instance, fake_save )
  save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/save_" + fake_save + "/metadata.json", 'w')
  save_file.puts( fake_state.to_json )
  save_file.close
end