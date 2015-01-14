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

    script_name = ""

    # Split into segments. The first segment is empty since `path` has a leading slash. A trailing
    # slash does not create an empty last segment.

    segments = path.split "/"
    segments.shift  # empty since `path` has a leading slash

    has_trailing_slash = path[-1] == "/"

    # Follow segments into the `public` directory.

    while segments.first and directory?( script_name + "/" + segments.first )
      script_name = script_name + "/" + segments.shift
    end

    # Is a component there? Which type?

    if segments.first and extension = component?( script_name + "/" + segments.first )
      application = script_name = script_name + "/" + segments.shift
    elsif extension = component?( script_name + "/index.vwf" )  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.vwf"  # TODO: configuration parameter for default application name
    elsif extension = component?( script_name + "/index.dae" )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.dae"  # TODO: configuration parameter for default application name
    elsif extension = component?( script_name + "/index.unity3d" )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.unity3d"  # TODO: configuration parameter for default application name
    end

    # If we found a component, return a successful match. Split the path at the component into
    # `script_name` and `path_info`. Identify the component as the application. The application will
    # be different from `script_name` if an implicit `index.*` component was used.

    if extension
      path_info = segments.shift( segments.length ).map { |segment| "/" + segment } .join( "" )
      path_info += "/" if has_trailing_slash
      Match.new [ script_name, path_info, application ]
    end

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
    elsif path =~ /\.(dae|unity3d)$/  # TODO: test  # TODO: or any other data type with automatic mapping from data type to component type  # TODO: sync with server mime types and mappings in vwf.js normalizedComponent()
      if file? path
        ""
      end
    end
  end

end
