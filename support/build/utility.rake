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

require "tempfile"

namespace "utility" do

    desc "Ensure that we're running under Bundler if a Gemfile is present."

    task :bundler do

        if File.exists? "Gemfile" and not ENV["BUNDLE_BIN_PATH"]

            message = "This Rakefile requires a Bundler environment."

            if needs_bundler = ! ENV["PATH"].split( File::PATH_SEPARATOR ).any? { |path| File.executable? "#{path}/bundle" }
                message += "\nInstall bundler: gem install bundler, and the gems: bundle install."
            elsif needs_bundle = ! system( "bundle check >/dev/null" )
                message += " Install the gems: bundle install."
            end

            message += ( needs_bundler || needs_bundle ? "\nThen invoke as: " : " Invoke as: " ) +
                "bundle exec rake" + "#{ ARGV.empty? ? "" : " " }#{ ARGV.join " " }."
    
            fail message

        end

    end

end

# Invoke a child rake in a Bundler environment.

# def bundle_rake *args
#   sh "bundle", "exec", "rake", *args
# end

# Invoke a child rake.

def rake *args
  ruby "-S", "rake", *args
end

# Like FileUtils#sh, but execute using CMD.EXE in the ruby environment being constructed.

def cmd *cmd

    options = Hash === cmd.last ? cmd.pop : {}
    env = Hash === cmd.first ? cmd.shift : {}

    set_verbose_option options
    options[:noop] ||= RakeFileUtils.nowrite_flag
    rake_check_options options, :noop, :verbose

    rake_output_message cmd.join " " if options[:verbose]

    Tempfile.open( [ "cmd", ".bat" ] ) do |tempfile|

        tempfile.puts <<-CMD.strip.gsub( %r{^ *}, "" )
            @ECHO OFF
            SETLOCAL
            #{ env.map { |key, value| "SET #{key}=" + ( value.nil? ? "" : value ) } .join "\n" }
            CALL #{ cmd.join " " }
            ENDLOCAL
        CMD

        tempfile.flush
        tempfile.chmod 0777-File.umask  # set execute permission

        unless options[:noop]
            ok = rake_system "CMD.EXE /C \"#{ native_path tempfile.path }\""
            status = ! ok && $?.nil? ? Rake::PseudoStatus.new( 1 ) : $?
            yield ok, status if block_given?
        end

    end

end

# Convert a path to a Windows path that will be understood by native tools.

def native_path path

    has_cygpath = ENV["PATH"].split( File::PATH_SEPARATOR ).any? do |path|
        File.executable? "#{path}/cygpath"
    end

    if has_cygpath
        `cygpath --windows "#{path}"`.strip  # for Cygwin
    else
        path  # outside Cygwin assume path is already in the native form
    end

end

# Rake.verbose, but default to true when not explicitly set.

def verbose_or_true
    verbose = Rake.verbose
    verbose == Rake::FileUtilsExt::DEFAULT ? true : verbose
end

# Rake.verbose, but default to false when not explicitly set.

def verbose_or_false
    verbose = Rake.verbose
    verbose == Rake::FileUtilsExt::DEFAULT ? false : verbose
end
