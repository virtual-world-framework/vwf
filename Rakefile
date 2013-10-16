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

require "rake"
require "rake/testtask"
require "rake/clean"

import "support/build/utility.rake"

# Delegate the standard tasks to any child projects.

DELEGATED_TASKS = [ :build, :test, :clean, :clobber, :full, :web ]

# Path to the standalone ruby built by support/build/Rakefile.

RUBY = "support/build/ruby-1.9.3-p392-i386-mingw32"  # TODO: get this from where it's defined in support/build/Rakefile
RUBY_GEM_HOME = "#{RUBY}/lib/ruby/gems/1.9.1"

# CLEAN and CLOBBER

CLOBBER.include "bin/*", "run.bat"

# Task Build That Includes Web Buildout
task :full => [:web, :build]
task :web

# Default Task
task :default => :full

# Build by default.

task :build

# Delegate standard tasks to descendant Rakefiles.
    
FileList[ "*/Rakefile", "*/*/Rakefile" ].map do |rakefile| # could use "*/**/Rakefile" to reach an arbitrary depth

    rakefile[ %r{(.*)/Rakefile}, 1 ]

end .each do |project|

    # Create a namespace for each child project.

    namespace = namespace project.gsub "/", "-" do

        # Create tasks delegating to the child project's rake.

        DELEGATED_TASKS.each do |name|
            task name do |task|
                chdir project do
                    rake name.to_s
                end
            end        
        end

    end

    # Make the parent tasks dependent on the child tasks.

    DELEGATED_TASKS.each do |name|
        task name => [ "utility:bundler", namespace[name] ]
    end

end

# Create a task for the support/build :ruby target.

support_build = namespace "support/build".gsub "/", "-" do
    task :ruby do |task|
        chdir "support/build" do
            rake :ruby.to_s
        end
    end
end

# == build =========================================================================================

if RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/
    task :build => :windows
end

desc "Install and configure a standalone ruby for Windows."

task :windows => [ :bundle, "run.bat" ]

desc "Install or update the bundled gems."

task :bundle => "#{RUBY_GEM_HOME}/.bundle_install_timestamp"

desc "Install or update the bundled gems."

file "#{RUBY_GEM_HOME}/.bundle_install_timestamp" => [ "#{RUBY}/bin/bundle.bat", "Gemfile.lock" ] do |task|
    cmd standalone_build_env, "bundle install --system"
    touch task.name
end

desc "Install the bundler gem."

file "#{RUBY}/bin/bundle.bat" => support_build[:ruby] do  # TODO: import support/build/Rakefile and use a direct dependency to avoid unnecessary rebuilds
    cmd standalone_build_env, "gem install bundler --no-rdoc --no-ri"
end

desc "Windows standalone launch script."

file "run.bat" => "Rakefile" do |task|

    rake_output_message "Creating #{task.name}"

    File.open( task.name, "w" ) do |io|

        io.puts <<-RUN.strip.gsub( %r{^ *(REM$)?}, "" )
            @ECHO OFF
            REM
            SETLOCAL
            REM
            SET PATH=#{ standalone_run_env["PATH"] }
            REM
            REM Show the user a hint when run in the default configuration. If arguments are provided, don't
            REM show the hint since it probably won't be correct, and presume that the user already understands
            REM where to connect to the server.
            REM
            IF NOT \"%*\" == \"\" GOTO NOMESSAGE
			echo.%~dp0|findstr /C:" " >nul 2>&1 
			if not errorlevel 1 (
				echo Your path contains whitespace which will cause issues with the server. Please move your VWF folder into a location without space characters in the directory path, and try run.bat again.
				GOTO :EOF
			)
            ECHO Virtual World Framework. Navigate to http://localhost:3000 to begin.
            :NOMESSAGE
            REM
            REM Start the server.
            REM
            bundle exec thin start %*
            REM
            ENDLOCAL
        RUN

        io.chmod 0777-File.umask  # set execute permission

    end

end

# == test ==========================================================================================

Rake::TestTask.new do |task| 
  task.libs << "test"
  
  task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb", "test/*_spec.rb", "test/*/*_spec.rb" ]

  task.verbose = true
end

desc "Run JavaScript client tests"
task "client:test" => "support-client:test"

# Environment for running the standalone ruby.

def standalone_run_env

    {
        "PATH" => [
            "#{ native_path RUBY }\\bin",
            "#{ native_path RUBY_GEM_HOME }\\bin",
            "%PATH%",
        ].join( ";" ),
    }

end

# Environment for building in the standalone ruby.

def standalone_build_env

    {

        # Reset the path to the standalone ruby and a generic Windows path.

        "PATH" => [
            "#{ native_path File.expand_path RUBY }\\bin",
            "#{ native_path File.expand_path RUBY_GEM_HOME }\\bin",
            "%SystemRoot%\\system32",
            "%SystemRoot%",
            "%SystemRoot%\\System32\\Wbem",
        ].join( ";" ),

        # Clear the inherited bundler environment.

        "BUNDLE_BIN_PATH" => nil,
        "BUNDLE_GEMFILE" => nil,
        "GEM_HOME" => nil,
        "GEM_PATH" => nil,
        "RUBYOPT" => nil,

    }

end

