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
require "rake/clean"
require "tilt"
require "tmpdir"
require "pathname"


SOURCE = "lib"
DESTINATION = "libz"
DOCUMENTATION = "../../public/web/docs/jsdoc"

PATTERNS = [ "vwf.js", "vwf/*.js", "vwf/*/*.js", "vwf/*/stage/*.js" ]

chdir SOURCE do
    MODULES = FileList.new( PATTERNS ).sort.map do |file|
        file.sub %r{\.js$}, ""
    end
end

CLEAN.include "build.js", "#{DESTINATION}/**/*.js.z", "#{DESTINATION}/build.txt"
CLOBBER.include "#{DESTINATION}", "#{DOCUMENTATION}"


desc "Run the RequireJS optimizer."

task :build => [ :clean, :compile, :compress, :documentation ]

desc "Generate the compilation script."

file "build.js" => "build.js.erb" do |task|

    File.open( task.name, "w" ) do |io|
        io.write Tilt.new( task.prerequisites.first ).
            render Object.new, :source => SOURCE, :destination => DESTINATION, :modules => MODULES
    end

end

desc "Compile."

task :compile => "build.js" do |task|

    separator = RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/ ? "\\;" : ":"

    sh <<-SH.strip.gsub %r{ +}, " "
        java -classpath bin/js.jar#{separator}bin/compiler.jar \
            org.mozilla.javascript.tools.shell.Main bin/r.js -o build.js
    SH

end

desc "Compress."

task :compress => "build.js" do |task|
    
    MODULES.each do |path|
        
        sh <<-SH.strip.gsub %r{ +}, " "
            java -jar bin/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --language_in ECMASCRIPT5_STRICT \
                --js '#{DESTINATION}/#{path}.js' --js_output_file '#{DESTINATION}/#{path}.js.z'
        SH

        mv "#{DESTINATION}/#{path}.js.z", "#{DESTINATION}/#{path}.js"

    end

end

desc "Generate the jsdoc documentation."

task :documentation do |task|

    Dir.mktmpdir nil, "." do |tmpdir| # not in /tmp since java can't see across /cygdrive/c/... on Cygwin

        # Calculate absolute paths for the output directory and the build tools.

        documentation = File.expand_path DOCUMENTATION
        build = File.expand_path "../build"

        # Copy the input directory to a temporary location.

        cp_r SOURCE + "/.", tmpdir

        # cd to the copy and build from there.

        chdir tmpdir do

            # Convert to relative paths so that java doesn't need to traverse /cygdrive/c/... on Cygwin.

            cwd = Pathname.new( "." ).expand_path

            documentation = Pathname.new( documentation ).expand_path.relative_path_from( cwd ).to_s
            build = Pathname.new( build ).expand_path.relative_path_from( cwd ).to_s

            # Convert /// comments to /** */ comments for jsdoc.

            FileList.new( PATTERNS ).sort.each do |path|

                sh <<-SH.strip.gsub %r{ +}, " "
                    ruby -p -i.bak -e ' \
                        case ( state ||= 0 ) + ( %r{^\s*///} ? 1 : 0 ) \
                            when 1 ; \
                                last = $_ ; sub %r{///}, "/**" ; \
                                state = 2 \
                            when 3 ; \
                                last = $_ ; sub %r{///}, " * " \
                            when 2 ;\
                                puts last.sub %r{///.*}, " */" ; \
                                state = 0 \
                        end \
                    ' '#{path}'
                SH

            end

            # Run jsdoc on the translated source.

            sh <<-SH.strip.gsub %r{ +}, " "

                java -jar #{build}/jsdoc_toolkit-2.4.0/jsrun.jar #{build}/jsdoc_toolkit-2.4.0/app/run.js \
                    -Djsdoc.dir=#{build}/jsdoc_toolkit-2.4.0 \
                    --template=#{build}/jsdoc_toolkit-2.4.0/templates/jsdoc --allfunctions --quiet --recurse=10 --directory=#{documentation} \
                    #{ FileList.new( PATTERNS ).sort.map { |path| "'" + path + "'" } .join " " }

            SH

        end

    end

end
