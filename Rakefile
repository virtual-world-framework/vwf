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


CLEAN.include "support/build/Pygments-1.4/**/*.pyc"
CLOBBER.include "bin/*", "run.bat"


# Delegate the standard tasks to any child projects.

DELEGATED_TASKS = [ :build, :test, :clean, :clobber ]

if RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/
		puts "If you are behind a proxy, please make sure your http_proxy variable is set for Cygwin. Otherwise, the build cannot continue. You may set your proxy using the bash command:

		export http_proxy=http://proxy-server.mycorp.com:3128/
		
		"
	sh "bash support/build/Scripts/update_ruby.sh"
end
	
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
        task name => namespace[name]
    end

end

# Invoke a child rake.

def rake *args
  ruby "-S", "rake", *args
end


# == build =========================================================================================

task :build => [ :common, :windows ]

# -- common ----------------------------------------------------------------------------------------

desc "Update the gems (generating bin/*)."

task :common do

    sh "bundle install --binstubs"

end

# -- windows ---------------------------------------------------------------------------------------

# Windows standalone build

task :windows => :common do

    if RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/

        DEVKIT = "../cache/ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx"
        RUBY = "../cache/ruby-1.8.7-p357-i386-mingw32"
		CURPATH = `cygpath -w -p $PWD`

        File.open( "#{DEVKIT}/config.yml", "w" ) do |io|
            io.puts "---"
            io.puts "- ../#{RUBY}"
        end

        sh "echo '" + <<-BAT.strip.gsub( %r{^ *}, "" ) + "' | CMD.EXE"
            @ECHO OFF
            REM Clear the bundle exec environment
            SET BUNDLE_BIN_PATH=
            SET BUNDLE_GEMFILE=
            SET GEM_HOME=
            SET GEM_PATH=
            SET RUBYOPT=
            REM Install DevKit in the local ruby
            SET DEVKIT=#{ DEVKIT.gsub( "/", "\\" ) }
            CD %DEVKIT%
            SET RUBY=..\\#{ RUBY.gsub( "/", "\\" ) }
            SET PATH=%SystemRoot%\\system32;%SystemRoot%;%SystemRoot%\\System32\\Wbem
            SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin
            ruby dk.rb install
            REM Configure the local ruby
            CD ..\\
            SET RUBY=#{ RUBY.gsub( "/", "\\" ) }
            SET PATH=%SystemRoot%\\system32;%SystemRoot%;%SystemRoot%\\System32\\Wbem
            SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin
            gem install bundler --no-rdoc --no-ri
			SET PWDPATH=#{ CURPATH }
            CD %PWDPATH%
			bundle install --system
        BAT

        File.open( "run.bat", "w" ) do |io|
            io.puts "@ECHO OFF"
            io.puts ""
            io.puts "SET RUBY=#{ RUBY.gsub( "/", "\\" ) }"
            io.puts "SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin"
            io.puts ""
            io.puts "call ruby bin\\thin start %*"
        end

    end
    
end


# == test ==========================================================================================

# Create the test task.

Rake::TestTask.new do |task| 

    task.libs << "test"
    task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    task.verbose = true

end
