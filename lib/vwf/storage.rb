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

class VWF::Storage

  require "vwf/storagefs"
  def initialize
      @storage_implementation = VWF::StorageFS.new()
  end
  
  # Function that takes the public path and the application and returns an array 
  # of the instance ID's for all instances with stored information. (Either metadata, persistence state, or saved states)
  def list_application_instances( public_path, application )
    @storage_implementation.list_application_instances( public_path, application )
  end

  # Function that takes the public_path, application and instance and returns the 
  # metadata for said instance (nil if no metadata available, otherwise in the form of a 
  # ruby hash)
  def get_instance_metadata( public_path, application, instance )
    @storage_implementation.get_instance_metadata( public_path, application, instance )
  end
  
  # Function that sets the metadata for a specific instance.
  # Takes the public path, application and instance to identify the instance,
  # as well as the metadata itself as arguments.
  # Metadata is expected to be in a ruby hash.
  def set_instance_metadata( public_path, application, instance, metadata )
    @storage_implementation.set_instance_metadata( public_path, application, instance, metadata )
  end
  
  # Function that retrieves the persistence state for an instance.
  # Takes public path, application and instance as arguments.
  # Returns nil if no persistence state found, otherwise returns ruby hash
  # containing the state information.
  def get_persistence_state( public_path, application, instance )
    @storage_implementation.get_persistence_state( public_path, application, instance )
  end
  
  # Function for setting the persistence state for an instance.
  # Takes public_path, application and instance arguments for identifying the
  # instance.
  # Takes the state to actually save (expects ruby hash format)
  # Takes an optional metadata argument for save specific metadata (expects ruby hash format )
  def set_persistence_state( public_path, application, instance, state, metadata )
    @storage_implementation.set_persistence_state( public_path, application, instance, state, metadata )
  end
  
  # Function that resturns an array containing the save names of all saves in a particular instance.
  # Takes public_path, application and instance as arguments.
  def list_instance_save_states( public_path, application, instance )
    @storage_implementation.list_instance_save_states( public_path, application, instance )
  end
  
  # Function that returns a ruby hash.  Each key is an instance ID, each value is an array containing
  # the save names of saves from that instance.
  # Takes the public path and application as arguments.
  def list_application_save_states( public_path, application )
    @storage_implementation.list_application_save_states( public_path, application )
  end
  
  # Function that returns the metadata for the specifified save.
  # Returns instance metadata if no save specific metadata available.
  # Returns nil if no metadata available at all.
  # Metadata is resturned in a ruby hash format.
  # Takes the public path, application, instance and save name as arguments.
  def get_save_metadata( public_path, application, instance, save_name )
    @storage_implementation.get_save_metadata( public_path, application, instance, save_name )
  end

  # Function that retrieves the save state for the specified save.
  # Save state is returned in a ruby hash format. Nil is returned if
  # no save state is found.
  def get_save_state( public_path, application, instance, save_name )
    @storage_implementation.get_save_state( public_path, application, instance, save_name )
  end

  # Function for storing a named save state.
  # Public path, application, instance and save name arguments define
  # the identity of the save state.
  # save_state contains the state to be saved in a ruby hash format.
  # metadata is an optional argument that should contain the save specific
  # metadata in a ruby hash format if available.
  def set_save_state( public_path, application, instance, save_name, save_state, metadata )
    @storage_implementation.set_save_state( public_path, application, instance, save_name, save_state, metadata )
  end
  
end