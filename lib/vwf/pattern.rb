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

class VWF::Pattern

  Match = Struct.new :captures

  attr_writer :mock_filesystem

  def initialize

    @template_extensions = VWF.settings.component_template_types.map do |template_type|
      "." + template_type.to_s
    end .unshift ""

    @captures = Match.new []

  end

  # incoming path                                       public_path             application     instance        private_path            

  # /path/to/component                                  "/path/to/component"    "index.vwf"     nil             nil                     
  # /path/to/component/                                 "/path/to/component"    "index.vwf"     nil             nil                     
  # /path/to/component/path/to/client/file              "/path/to/component"    "index.vwf"     nil             "path/to/client/file"   
  # /path/to/component/path/to/component/file           "/path/to/component"    "index.vwf"     nil             "path/to/component/file"
  # /path/to/component/socket/path                      "/path/to/component"    "index.vwf"     nil             "socket/path"           

  # /path/to/component.vwf                              "/path/to"              "component.vwf" nil             nil                     
  # /path/to/component.vwf/                             "/path/to"              "component.vwf" nil             nil                     
  # /path/to/component.vwf/path/to/client/file          "/path/to"              "component.vwf" nil             "path/to/client/file"   
  # /path/to/component.vwf/path/to/component/file       "/path/to"              "component.vwf" nil             "path/to/component/file"
  # /path/to/component.vwf/socket/path                  "/path/to"              "component.vwf" nil             "socket/path"           

  # /path/to/component/instance                         "/path/to/component"    "index.vwf"     "instance"      nil                     
  # /path/to/component/instance/                        "/path/to/component"    "index.vwf"     "instance"      nil                     
  # /path/to/component/instance/path/to/client/file     "/path/to/component"    "index.vwf"     "instance"      "path/to/client/file"   
  # /path/to/component/instance/path/to/component/file  "/path/to/component"    "index.vwf"     "instance"      "path/to/component/file"
  # /path/to/component/instance/socket/path             "/path/to/component"    "index.vwf"     "instance"      "socket/path"           

  # /path/to/component.vwf/instance                     "/path/to"              "component.vwf" "instance"      nil                     
  # /path/to/component.vwf/instance/                    "/path/to"              "component.vwf" "instance"      nil                     
  # /path/to/component.vwf/instance/path/to/client/file "/path/to"              "component.vwf" "instance"      "path/to/client/file"   
  # /path/to/component.vwf/instance/path/to/component/file "/path/to"           "component.vwf" "instance"      "path/to/component/file"
  # /path/to/component.vwf/instance/socket/path         "/path/to"              "component.vwf" "instance"      "socket/path"           

  def match path

    public_path = "/"

    segments = path.split "/"
    segments.shift # the first segment is empty since path has a leading slash

    while segment = segments.first and directory? File.join( public_path, segment )
      public_path = File.join public_path, segments.shift
    end

    if segment = segments.first and extension = component?( File.join( public_path, segment ) )
      application = segment
      segments.shift
    elsif extension = component?( File.join( public_path, "index.vwf" ) )  # TODO: configuration parameter for default application name
      application = "index.vwf"  # TODO: configuration parameter for default application name
    elsif extension = component?( File.join( public_path, "index.dae" ) )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = "index.dae"  # TODO: configuration parameter for default application name
    elsif extension = component?( File.join( public_path, "index.unity3d" ) )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = "index.unity3d"  # TODO: configuration parameter for default application name
    end

    if extension

      instance = segments.shift if instance?( segments.first )

      private_path = File.join( segments.shift segments.length ) unless segments.empty?      

        

      Match.new [ public_path, application, instance, private_path ]

    end

    # TODO: which parts are URL paths and which are filesystem paths? don't use File.join on URL paths

  end

private

  def directory? path
    if @mock_filesystem
      @mock_filesystem.any? do |directory, files|
        path == directory
      end
    else
      File.directory? File.join( VWF.settings.public_folder, path )
    end
  end

  def file? path
    if @mock_filesystem
      @mock_filesystem.any? do |directory, files|
        files.any? do |file|
          path == File.join( directory, file )
        end
      end
    else
      File.file? File.join( VWF.settings.public_folder, path )
    end
  end

  def component? path
    if path =~ /\.vwf$/
      @template_extensions.any? do |template_extension|
        if file? path + template_extension
          break template_extension
        end
      end
    # elsif path =~ /\.(dae|unity3d)$/  # TODO: test  # TODO: or any other data type with automatic mapping from data type to component type  # TODO: sync with server mime types and mappings in vwf.js normalizedComponent()
    #   if file? path
    #     ""
    #   end
    end
  end

  def instance? segment
    segment =~ /^[0-9A-Za-z]{16}$/
  end

end
