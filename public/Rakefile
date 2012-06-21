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
require "yaml"


CLOBBER.include "web/**/*.html"
CLOBBER.include "web/*.html"

task :default => [ :clean, :clobber, :build ]

desc "Generate the catalog and documentation."

task :build => "web/catalog.html" do
	sh "bundle install"
	sh "bundle install --binstubs"
	
	ORG_PATH = ENV["PATH"]
	ENV["PATH"] = FileList[ "#{ENV['PWD']}/support/build/*" ].join( ":" ) + ":" + ENV["PATH"]
	
    if RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/
	sh "touch /usr/bin/pygmentize"
	sh "chmod -R 777 /usr/bin/pygmentize"
	sh "cp #{ENV['PWD']}/support/build/Pygments-1.4/pygmentize /usr/bin/pygmentize"
	end

	
	sh "../bin/rocco web/docs/application/*.vwf.yaml"
    sh "../bin/rocco web/docs/application/example.js"
	
	ENV["PATH"] = ORG_PATH
	
 	md = FileList[ "web/*.md" ]
	md.each do |md|
		if md == "web/about.md"
			sh "( cat web/format/preamble ; kramdown 'web/format/carousel.md' ;  kramdown 'web/about.md' ; cat web/format/postamble ) > 'web/about.html'"
		elsif md == "web/glossary.md"
			sh "( cat web/format/preamble ; kramdown 'web/format/glossarypre.md' ;  kramdown 'web/glossary.md' ; cat web/format/postamble ) > 'web/glossary.html'"
		else
			sh "( cat web/format/preamble ; kramdown '#{md}' ; cat web/format/postamble ) > '#{ md.ext ".html" }'"
		end
    end
	
    FileList[ "web/docs/**/*.md" ].each do |md|
        sh "( cat web/docs/format/preamble ; kramdown '#{md}' ; cat web/docs/format/postamble ) > '#{ md.ext ".html" }'"
    end


end

desc "Generate the catalog."

file "web/catalog.html" => "web/catalog.html.erb" do |task|

    component_types = [ :json, :yaml ]
    image_types = [ :png, :jpg, :gif ]

    patterns = component_types.map { |type| "**/*.vwf.#{type}" }

    applications = FileList.new( patterns ).sort.map do |file|

        path, name = File.split file

        ext = File.extname name
        base = File.basename name, ext

        type = image_types.find do |type|
            File.exist? "#{path}/#{base}.catalog.#{type}"
        end

        descr = ""
        begin
            descrFile = YAML.load( File.read( "#{path}/#{base}.catalog.yaml" ) )
            descr = descrFile["description"]
        rescue => err
            err
        end

        [
            ( base == "index.vwf" ? path : file ),
            type && "#{path}/#{base}.catalog.#{type}",
            path, 
            descr
        ]

    end .select do |application, image, name, description|

        image

    end

    File.open( task.name, "w" ) do |io|
        io.write Tilt.new( task.prerequisites.first ).
            render Object.new, :applications => applications
    end

end
