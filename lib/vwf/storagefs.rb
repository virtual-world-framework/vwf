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


class VWF::StorageFS

  def initialize
    @save_folder = "documents"
  end
  
  # Function that takes the public path and the application and returns an array 
  # of the instance ID's for all instances with stored information. (Either metadata, persistence state, or saved states)
  def list_application_instances( public_path, application )
    result = []
    potential_app_dir = @save_folder + public_path + "/" + application
    if File.directory?( potential_app_dir )
      Dir.foreach( potential_app_dir ) do | filename |
        if File.directory?( potential_app_dir + "/" + filename ) && filename =~ /^instance_*/
          potential_instance_id = filename.slice( 9, filename.length - 9 )
          unless get_instance_metadata( public_path, application, potential_instance_id ).nil? and get_persistence_state( public_path, application, potential_instance_id ).nil? and list_instance_save_states( public_path, application, potential_instance_id ).length == 0
            result.push potential_instance_id
          end
        end
      end
    end
    result.sort!
  end

  # Function that takes the public_path, application and instance and returns the 
  # metadata for said instance (nil if no metadata available, otherwise in the form of a 
  # ruby hash)
  def get_instance_metadata( public_path, application, instance )
    result = nil
    potential_filename = @save_folder + public_path + "/" + application + "/instance_" + instance + "/metadata.json"
    if File.file?( potential_filename )
      file_contents = File.read( potential_filename )
      result = JSON.parse( "#{ file_contents }", :max_nesting => 100 )
    end
    result
  end
  
  # Function that sets the metadata for a specific instance.
  # Takes the public path, application and instance to identify the instance,
  # as well as the metadata itself as arguments.
  # Metadata is expected to be in a ruby hash.
  def set_instance_metadata( public_path, application, instance, metadata )
    segments = public_path.split( "/" )
    segments.push( application )
    segments.push( "instance_" + instance )
    path = @save_folder
    segments.each do | segment |
      path = path + "/" + segment
      unless File.directory? path
        FileUtils.mkdir_p path
      end
    end
    
    new_file = File.open( @save_folder + public_path + "/" + application + "/instance_" + instance + "/metadata.json", 'w')
    new_file.puts metadata.to_json
    new_file.close    
  end
  
  # Function that retrieves the persistence state for an instance.
  # Takes public path, application and instance as arguments.
  # Returns nil if no persistence state found, otherwise returns ruby hash
  # containing the state information.
  def get_persistence_state( public_path, application, instance )
    result = nil
    potential_filename = @save_folder + public_path + "/" + application + "/instance_" + instance + "/persistenceState.vwf.json"
    if File.file?( potential_filename )
      file_contents = File.read( potential_filename )
      result = JSON.parse( "#{ file_contents }", :max_nesting => 100 )
    end
    result
  end
  
  # Function for setting the persistence state for an instance.
  # Takes public_path, application and instance arguments for identifying the
  # instance.
  # Takes the state to actually save (expects ruby hash format)
  # Takes an optional metadata argument for save specific metadata (expects ruby hash format )
  # WARNING: Take note, if an instance already has metadata, but you provide 'nil' metadata, the
  #          old metadata will persist.
  def set_persistence_state( public_path, application, instance, state, metadata )
    segments = public_path.split( "/" )
    segments.push( application )
    segments.push( "instance_" + instance )
    path = @save_folder
    segments.each do | segment |
      path = path + "/" + segment
      unless File.directory? path
        FileUtils.mkdir_p path
      end
    end
    
    new_file = File.open( @save_folder + public_path + "/" + application + "/instance_" + instance + "/persistenceState.vwf.json", 'w')
    new_file.puts state.to_json
    new_file.close
    
    unless metadata.nil?
      meta_file = File.open( @save_folder + public_path + "/" + application + "/instance_" + instance + "/metadata.json", 'w')
      meta_file.puts metadata.to_json
      meta_file.close
    end
  end
  
  # Function that returns an array containing the save names of all saves in a particular instance.
  # Takes public_path, application and instance as arguments.
  def list_instance_save_states( public_path, application, instance )
    result = []
    potential_dir_name = @save_folder + public_path + "/" + application + "/instance_" + instance
    if File.directory?( potential_dir_name )
      Dir.foreach( potential_dir_name ) do | filename |
        if File.directory?( potential_dir_name + "/" + filename ) && filename =~ /^save_*/
          if File.file?( potential_dir_name + "/" + filename + "/saveState.vwf.json" )
            result.push filename.slice( 5, filename.length - 5 )
          end
        end
      end
    end
    result.sort!
  end
  
  # Function that returns a ruby hash.  Each key is an instance ID, each value is an array containing
  # the save names of saves from that instance.
  # Takes the public path and application as arguments.
  def list_application_save_states( public_path, application )
    result = {}
    application_dir_name = @save_folder + public_path + "/" + application
    if File.directory?( application_dir_name )
      Dir.foreach( application_dir_name ) do | potential_instance |
        if potential_instance =~ /^instance_*/
          instance_id = potential_instance.slice( 9, potential_instance.length - 9 )
          instance_saves = list_instance_save_states( public_path, application, instance_id )
          if instance_saves.length > 0 
            result[ instance_id ] = instance_saves
          end
        end
      end
    end
    result
  end
  
  # Function that returns the metadata for the specifified save.
  # Returns instance metadata if no save specific metadata available.
  # Returns nil if no metadata available at all.
  # Metadata is resturned in a ruby hash format.
  # Takes the public path, application, instance and save name as arguments.
  def get_save_metadata( public_path, application, instance, save_name )
    result = nil
    potential_filename = @save_folder + public_path + "/" + application + "/instance_" + instance + "/save_" + save_name + "/metadata.json"
    if File.file?( potential_filename )
      file_contents = File.read( potential_filename )
      result = JSON.parse( "#{ file_contents }", :max_nesting => 100 )
    else
      result = get_instance_metadata( public_path, application, instance )
    end
    result
  end

  # Function that retrieves the save state for the specified save.
  # Save state is returned in a ruby hash format. Nil is returned if
  # no save state is found.
  def get_save_state( public_path, application, instance, save_name )
    result = nil
    potential_filename = @save_folder + public_path + "/" + application + "/instance_" + instance + "/save_" + save_name + "/saveState.vwf.json"
    if File.file?( potential_filename )
      file_contents = File.read( potential_filename )
      result = JSON.parse( "#{ file_contents }", :max_nesting => 100 )
    end
    result
  end

  # Function for storing a named save state.
  # Public path, application, instance and save name arguments define
  # the identity of the save state.
  # save_state contains the state to be saved in a ruby hash format.
  # metadata is an optional argument that should contain the save specific
  # metadata in a ruby hash format if available.
  def set_save_state( public_path, application, instance, save_name, save_state, metadata )  
    segments = public_path.split( "/" )
    segments.push( application )
    segments.push( "instance_" + instance )
    segments.push( "save_" + save_name )
    path = @save_folder
    segments.each do | segment |
      path = path + "/" + segment
      unless File.directory? path
        FileUtils.mkdir_p path
      end
    end
    
    new_file = File.open( @save_folder + public_path + "/" + application + "/instance_" + instance + "/save_" + save_name + "/saveState.vwf.json", 'w')
    new_file.puts save_state.to_json
    new_file.close
    
    unless metadata.nil?
      meta_file = File.open( @save_folder + public_path + "/" + application + "/instance_" + instance + "/save_" + save_name + "/metadata.json", 'w')
      meta_file.puts metadata.to_json
      meta_file.close
    end
  end  
end