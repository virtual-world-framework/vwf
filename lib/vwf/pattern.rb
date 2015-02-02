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

# `VWF::Pattern` is a `Regexp`-compatible class to detect paths that refer to VWF applications.
# Successful matches return `script_name` and `path_info` as captures.

class VWF::Pattern

  Match = Struct.new :captures

  attr_writer :mock_filesystem

  def initialize

    @template_extensions = VWF.settings.component_template_types.map do |template_type|
      "." + template_type.to_s
    end .unshift ""

    @captures = Match.new []

  end

  # Test `path` for a match. Return `script_name` and `path_info` as captures on a successful match.

  def match path

    # Search storage for an application matching the path.

    script_name = application_in_storage? path

    # If not found, search the filesystem for a matching component. An application for the component
    # is created in storage if found.

    script_name = application_in_filesystem? path unless script_name

    # If the path matches an application, split the path at the application and return `script_name`
    # (the application) and `path_info` (the resource inside the application).

    if script_name
      path_info = path[ script_name.length, path.length ]
      Match.new [ script_name, path_info ]
    end

  end

private

  # Determine if `path` refers an to application in the storage database. Return the application
  # path if so.

  def application_in_storage? path

    # Find the longest application path that matches the first part of `path`. The reverse sort
    # ensures that longer, deeper paths are encountered earlier so that applications may refer to
    # components inside of components.

    script_name, _ = VWF.storage.reverse_each.find do |id, _|
      path.start_with?( id ) && ( path.length == id.length || path[ id.length ] == "/" )
    end

    # Return the application path found, if any.

    script_name

  end

  # Determine if `path` refers to a component or other launchable resource in the public directory.
  # If so, create an application in storage for that resource and return the application path.

  def application_in_filesystem? path

    # Build the potential application path in `script_name`.

    script_name = ""

    # Split `path` into segments. The first segment is empty since `path` has a leading slash. A
    # trailing slash does not create an empty last segment.

    segments = path.split "/"
    segments.shift  # empty since `path` has a leading slash

    # Follow segments into the `public` directory.

    while segments.first and directory?( script_name + "/" + segments.first )
      script_name = script_name + "/" + segments.shift
    end

    # Is a component there? Which type?

    if segments.first && component?( script_name + "/" + segments.first )
      application = script_name = script_name + "/" + segments.shift
    elsif component?( script_name + "/index.vwf" )  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.vwf"  # TODO: configuration parameter for default application name
    elsif component?( script_name + "/index.dae" )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.dae"  # TODO: configuration parameter for default application name
    elsif component?( script_name + "/index.unity3d" )  # TODO: delegate list of supported types to #component  # TODO: configuration parameter for default application name
      application = script_name + "/" + "index.unity3d"  # TODO: configuration parameter for default application name
    end

    # Create an application in storage if we found a component.
    # 
    # When `path` refers to an alias, create applications under both the canonical name and the
    # alias. For example, if `path` contains `/path/to/application/...`, create:
    # 
    #   `/path/to/application/index.vwf` => `/path/to/application/index.vwf`
    #   `/path/to/application` => `/path/to/application/index.vwf`
    # 
    # The alias would hide references using the canonical name, otherwise.

    if application
      if script_name == application
        VWF.storage.create application, application
      else
        VWF.storage.create script_name, application
        VWF.storage.create application, application unless VWF.storage[ application ]
      end
    else
      script_name = nil
    end

    # Return the application path created, if any.

    script_name

  end

  # Determine if `path` refers to a directory in the public directory.

  def directory? path
    if @mock_filesystem
      @mock_filesystem.any? do |directory, files|
        path == directory
      end
    else
      File.directory? File.join( VWF.settings.public_folder, path )
    end
  end

  # Determine if `path` refers to a file in the public directory.

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

  # Determine if `path` refers to a component or other launchable resource in the public directory.

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
