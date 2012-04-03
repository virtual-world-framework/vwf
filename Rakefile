require "rake"
require "rake/testtask"
require "rake/clean"


CLEAN.include "support/build/Pygments-1.4/**/*.pyc"
CLOBBER.include "bin/*", "docs/**/*.html", "run.bat", "public/index.html"


# Delegate the standard tasks to any child projects.

DELEGATED_TASKS = [ :build, :test, :clean, :clobber ]

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

desc "Update the gems (generating bin/*), and generate the documentation."

task :common do

    sh "bundle install --binstubs"

    original_path = ENV["PATH"]
    ENV["PATH"] = FileList[ "support/build/*" ].join( ":" ) + ":" + ENV["PATH"]

    FileList[ "public/web/*.md" ].each do |md|
        sh "( cat public/web/format/preamble ; Markdown.pl '#{md}' ; cat public/web/format/postamble ) > '#{ md.ext ".html" }'"
    end

    FileList[ "public/web/docs/**/*.md" ].each do |md|
        sh "( cat public/web/docs/format/preamble ; Markdown.pl '#{md}' ; cat public/web/docs/format/postamble ) > '#{ md.ext ".html" }'"
    end

    sh "bundle exec rocco public/web/docs/application/*.vwf.yaml"
    sh "bundle exec rocco public/web/docs/application/example.js"
    
    ENV["PATH"] = original_path

end

# -- windows ---------------------------------------------------------------------------------------

# Window standalone build

task :windows => :common do

    if RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/

        DEVKIT = "support/build/ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx"
        RUBY = "support/build/ruby-1.8.7-p357-i386-mingw32"

        File.open( "#{DEVKIT}/config.yml", "w" ) do |io|
            io.puts "---"
            io.puts "- ../../../#{RUBY}"
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
            SET RUBY=..\\..\\..\\#{ RUBY.gsub( "/", "\\" ) }
            SET PATH=%SystemRoot%\\system32;%SystemRoot%;%SystemRoot%\\System32\\Wbem
            SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin
            ruby dk.rb install
            REM Configure the local ruby
            CD ..\\..\\..
            SET RUBY=#{ RUBY.gsub( "/", "\\" ) }
            SET PATH=%SystemRoot%\\system32;%SystemRoot%;%SystemRoot%\\System32\\Wbem
            SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin
            gem install bundler --no-rdoc --no-ri
            bundle install --system
        BAT

        File.open( "run.bat", "w" ) do |io|
            io.puts "@ECHO OFF"
            io.puts ""
            io.puts "SET RUBY=#{ RUBY.gsub( "/", "\\" ) }"
            io.puts "SET PATH=%PATH%;%RUBY%\\bin;%RUBY%\\lib\\ruby\\gems\\1.8\\bin"
            io.puts ""
            io.puts "ruby bin\\thin start %*"
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
