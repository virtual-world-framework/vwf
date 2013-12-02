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
#
# This is an EXPERIMENTAL module to support POSTs to the VWF persistence directory. There is virtually
# no protection against overwriting any file in ^/public, and potentially elsewhere on the server.
# DO NOT ENABLE ON A PRODUCTION SERVER.

class VWF::Application::Persistence < Sinatra::Base

  require "vwf/storage"
  
  def initialize( root, env )
    super nil
    @root = root
    @env = env
    @storage = VWF::Storage.new()
  end
  
  # /instances returns as JSON, an array of objects, each representing a VWF instance
  # that is either currently running or recorded in the storage system.
  get "/instances" do
    content_type :json
    result = [ ]
    # Get the list of currently recorded instances of this application.
    instance_id_list = @storage.list_application_instances( @env[ 'vwf.root' ], @env[ 'vwf.application' ] )
    # Loop over currently active instances, identify any that are active instances of this application
    # note that they are active, and add to the list of instances of this application if not already present.
    active_instance_id_list = [ ]
    VWF::Application::Reflector.instances( env ).map do |resource, instance|
      resource_segments = resource.split( "/" )
      if resource_segments.length > 3
          active_instance_id = resource_segments.pop
          active_instance_application = resource_segments.pop
          active_instance_public_path = resource_segments.join( "/" )
          if @env[ 'vwf.root' ] == active_instance_public_path and @env[ 'vwf.application' ] == active_instance_application
            active_instance_id_list.push active_instance_id
            unless instance_id_list.include? active_instance_id
              instance_id_list.push active_instance_id
            end
          end
      end
    end
    # Sort instances, then generate the hash objects containing instance data using a helper function
    # and return the resulting array of hashes parsed into JSON as the body of this request.
    instance_id_list.sort!
    instance_id_list.each do | instance_id |
      result.push generate_instance_hash( request.scheme, request.host_with_port, @env[ 'vwf.root' ], @env[ 'vwf.application' ], instance_id, active_instance_id_list.include?( instance_id ) )
    end
    result.to_json
  end
  
  # /saves varies dependent upon context.
  # If called with an instance as part of the URL, it returns an array of objects containing data
  # about all saves corresponding to that instance of that application, in the form of JSON.
  # If called without an instance as part of the URL, it returns a hash of instance ID keys
  # paried with arrays of objects containing data about all saves regarding that key's instance
  # for that application, again in the form of JSON.
  get "/saves" do
    content_type :json
    # List saves. First need to determine if we're running per instance or across entire application.
    result = [ ]
    if @env[ 'vwf.instance' ]
      # Listing all saves from this particular instance.
      instance_save_names = @storage.list_instance_save_states( @env[ 'vwf.root' ], @env[ 'vwf.application' ], @env[ 'vwf.instance' ] )
      instance_save_names.each do | instance_save_name |
        result.push generate_save_hash( request.scheme, request.host_with_port, @env[ 'vwf.root' ], @env[ 'vwf.application' ], @env[ 'vwf.instance' ], instance_save_name )
      end
    else
      # Listing all saves for all instances, so we should be a hash not an array.
      result = { }
      application_save_states = @storage.list_application_save_states( @env[ 'vwf.root' ], @env[ 'vwf.application' ] )
      application_save_states.each do | instance_id, instance_save_names |
	    instance_save_array = [ ]
        instance_save_names.each do | instance_save_name |
          instance_save_array.push generate_save_hash( request.scheme, request.host_with_port, @env[ 'vwf.root' ], @env[ 'vwf.application' ], instance_id, instance_save_name )
        end
		    result[ instance_id ] = instance_save_array
      end
    end
    result.to_json
  end
  
  get "/listallsaves" do
    result = recursiveSavesInDirectory( request.scheme, request.host_with_port, "" )
    result.compact.to_json
  end
  
  get "/listdescendentsaves" do
    result = recursiveSavesInDirectory( request.scheme, request.host_with_port, request.env["vwf.root"] )
    result.compact.to_json
  end

  get "/listsaves" do
    result = savesInDirectory( request.scheme, request.host_with_port, request.env["vwf.root"] )
    result.compact.to_json
  end

  get "/load/:loadname/:loadrevision" do
    pass unless saveExists?(request.env["vwf.root"], params['loadname'], params['loadrevision'])
    if request.env["vwf.instance"].nil?
      redirect to random_instance_id + "/load/" + params['loadname'] + "/" + params['loadrevision'] + "/" + ( request.query_string.length > 0 ? "?" + request.query_string : "" )
    else
      @env['PATH_INFO'] = "/"
      @env['vwf.loadrevision'] = params['loadrevision']
      VWF::Application.new(@env).call @env      
    end
  end  
  get "/load/:loadname/:loadrevision/*" do
    pass unless saveExists?(request.env["vwf.root"], params['loadname'], params['loadrevision'])
    puts params['splat']
    @env['PATH_INFO'] = "/" + params['splat'].join()
    @env['vwf.load'] = params['loadname']
    @env['vwf.loadrevision'] = params['loadrevision']
    VWF::Application.new(@env).call @env
  end  
  get "/load/:loadname" do
    pass unless saveExists?(request.env["vwf.root"], params['loadname'], nil)
    if request.env["vwf.instance"].nil?
      redirect to random_instance_id + "/load/" + params['loadname'] + "/" + ( request.query_string.length > 0 ? "?" + request.query_string : "" )
    else
      @env['PATH_INFO'] = "/"
      @env['vwf.load'] = params['loadname']
      VWF::Application.new(@env).call @env
    end
  end
  get "/load/:loadname/*" do
    pass unless saveExists?(request.env["vwf.root"], params['loadname'], nil)
    puts params['splat']
    @env['PATH_INFO'] = "/" + params['splat'].join()
    @env['vwf.load'] = params['loadname']
    VWF::Application.new(@env).call @env
  end

  post "*/save/:savename" do

    pass unless settings.development? # only in development mode
    public_path = "documents"
    segments = env["vwf.root"].split("/")
    segments.push(params[:savename])
    segments.each do |segment|
      public_path = public_path + "/" + segment
      unless File.directory? public_path
        FileUtils.mkdir_p public_path
      end
    end
    
    f = File.open('documents/'+env["vwf.root"]+'/'+params[:savename]+"/saveState"+params["extension"], 'w')
    f.puts params["jsonState"]
    f.close

    f = File.open('documents/'+env["vwf.root"]+'/'+params[:savename]+"/saveState_"+Time.now.utc.to_i.to_s+params["extension"], 'w')
    f.puts params["jsonState"]
    f.close

  end

  
  helpers do

    # Helper function to generate a hash object containing pertinent instance data.
    def generate_instance_hash( scheme, host_with_port, public_path, application, instance, active )
      result = {}
      result[ "instance_id" ] = instance
      result[ "url" ] = scheme + "://" + host_with_port + public_path + "/" + application + "/" + instance
      result[ "active" ] = active
      result[ "vwf_info" ] = {}
      result[ "vwf_info" ][ "public_path" ] = public_path
      result[ "vwf_info" ][ "application" ] = application
      result[ "vwf_info" ][ "path_to_application" ] = public_path + "/" + application
      result[ "vwf_info" ][ "instance" ] = instance
      metadata = @storage.get_instance_metadata( public_path, application, instance )
      if metadata.nil?
        result[ "metadata" ] = {}
      else
        result[ "metadata" ] = metadata
      end
      result
    end
    
    # Helper function to generate a hash object containing pertinent save data.
    def generate_save_hash( scheme, host_with_port, public_path, application, instance, save_name )
      result = {}
      result[ "name" ] = save_name
      result[ "url" ] = scheme + "://" + host_with_port + public_path + "/" + application + "/" + instance + "/saves/" + save_name
      result[ "vwf_info" ] = {}
      result[ "vwf_info" ][ "public_path" ] = public_path
      result[ "vwf_info" ][ "application" ] = application
      result[ "vwf_info" ][ "path_to_application" ] = public_path + "/" + application
      result[ "vwf_info" ][ "instance" ] = instance
      metadata = @storage.get_save_metadata( public_path, application, instance, save_name )
      if metadata.nil?
        result[ "metadata" ] = {}
      else
        result[ "metadata" ] = metadata
      end
      result
    end
    
    def random_instance_id  # TODO: don't count on this for security; migrate to a proper instance id, in a cookie, at least twice as long, and with verified randomness
      "%08x" % rand( 1 << 32 ) + "%08x" % rand( 1 << 32 ) # rand has 52 bits of randomness; call twice to get 64 bits
    end

    def saveExists?( directoryRoot, saveName, saveRevision )
      if saveRevision.nil?
        File.exists?(VWF.settings.public_folder+"/../documents#{ directoryRoot }/#{ saveName }/saveState.vwf.json")
      else
        File.exists?(VWF.settings.public_folder+"/../documents#{ directoryRoot }/#{ saveName }/saveState_"+saveRevision+".vwf.json")
      end
    end

    def recursiveSavesInDirectory( scheme, host_with_port, directory_path )
      directory = Rack::Directory.new('documents')
      directory._call({'SCRIPT_NAME'=>scheme+'://'+host_with_port, 'PATH_INFO'=>directory_path})
      dirContents = directory.list_directory[2].files 
      result = []
      result = result.concat( savesInDirectory( scheme, host_with_port, directory_path ) )
      result.compact
      dirContents.each do |dirContent|
        if dirContent[3] == "directory"
          newDirName = directory_path + "/" + dirContent[1]
          if newDirName[newDirName.length - 1] == '/'
            newDirName = newDirName.slice(0, newDirName.length - 1)
          end
          result.concat( recursiveSavesInDirectory( scheme, host_with_port, newDirName))
          result.compact
        end
      end
      result
    end

    def savesInDirectory( scheme, host_with_port, directory_path )
      directory = Rack::Directory.new('documents')
      directory._call({'SCRIPT_NAME'=>scheme+'://'+host_with_port, 'PATH_INFO'=>directory_path})
      dirContents = directory.list_directory[2].files 
      result = []
      dirContents.each do |dirContent|
        if dirContent[3] == "directory"
          sub_directory = Rack::Directory.new('documents')
          sub_directory._call({'SCRIPT_NAME'=>scheme+'://'+host_with_port, 'PATH_INFO'=>directory_path+"/"+dirContent[1]})
          subDirContents = sub_directory.list_directory[2].files
          revision_list = []
          subDirContents.each do |subDirContent|
            if subDirContent[3] == "application/json"
              if subDirContent[1].length > 18
                if subDirContent[1].slice(0,10) == "saveState_" and subDirContent[1].slice(subDirContent[1].length() - 9, 9) == ".vwf.json"
                  potentialTimestamp = subDirContent[1].slice(10, subDirContent[1].length() - 19)
                  timestamp = Integer(potentialTimestamp) rescue nil
                  if timestamp
                    revision_list.push( timestamp )
                  end
                end
              end
            end
          end
          if revision_list.length > 0
            baseName = dirContent[1]
            if baseName.slice(baseName.length - 1) == "/"
              baseName = baseName.slice(0, baseName.length - 1)
            end
            revision_list.sort!
            firstEntry = true
            while revision_list.length > 0
              entry = revision_list.pop
              result.push({ "applicationpath" => directory_path, "savename" => baseName, "revision"=> entry, "latestsave"=>firstEntry })
              firstEntry = false
            end
          end
        end
      end 
      result.compact
    end
  end
end
