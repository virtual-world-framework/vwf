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
    it "returns nothing when directory is empty" do
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end

    it "does not return directories" do
      create_instance_path(@fake_instance)
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end

    it "returns a valid instance" do
      create_instance_persistence_state(@fake_instance)
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ @fake_instance ]
    end

    it "does not return an invalid instance" do
      create_instance_path(@fake_second_instance)
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ ]
    end

    it "returns multiple valid instances" do
      create_instance_persistence_state(@fake_instance)
      create_instance_persistence_state(@fake_second_instance)
      @storage_fs.list_application_instances( @fake_public_path, @fake_application ).must_equal [ @fake_instance, @fake_second_instance ]
    end
  end

  describe ".get_instance_metadata" do
    before do
      @fake_persistence_metadata= { "datatype" => "persistence" }
    end

    it "does some stuff"
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

def create_instance_path(fake_instance)
  FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance
end

def create_save_path(fake_instance, fake_save)
  FileUtils.mkdir_p "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/save_" + fake_save
end

def create_instance_persistence_state(fake_instance)
  create_instance_path(fake_instance)
  save_file = File.open( "documents" + @fake_public_path + "/" + @fake_application + "/instance_" + fake_instance + "/persistenceState.vwf.json", 'w')
  save_file.puts( { "data" => "test" }.to_json )
  save_file.close
end
