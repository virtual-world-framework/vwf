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


CLOBBER.include('/web/**/*.html')
CLOBBER.include('/web/*.html')


task :default => [ :clean, :clobber, :web ]

desc "Generate the catalog and documentation."

task :build do 
end
task :full do 
end

desc "Clean up the generated web site files."

task :clean do 
	# Clean the web folders of generated html
	sh "rm -rf web/*.html web/**/*.html"
end

desc "Build the web site."

task :web do

    # Add the build tools to the path.
    original_path = ENV["PATH"]
    ENV["PATH"] = File.expand_path( "../support/build/Pygments-1.4" ) + ":" + ENV["PATH"]
	
    # Render the Markdown.

    FileList[ "web/*.md" ].each do |md|
        if md == "web/about.md"
            sh "( cat web/format/preamble ; kramdown 'web/format/carousel.md' ;  kramdown 'web/about.md' ; cat web/format/postamble ) > 'web/about.html'"
        elsif md == "web/documentation.md"
            sh "( cat web/format/preamble ; cat web/format/docs.preamble ; 
                kramdown 'web/documentation.md' ; 
                kramdown 'web/docs/install.md' ; 
                kramdown 'web/docs/tutorial1.md' ; 
                kramdown 'web/docs/tutorial2.md' ; 
                kramdown 'web/docs/devguide.md' ; 
                kramdown 'web/docs/architecture.md' ; 
                kramdown 'web/docs/components.md' ; 
                kramdown 'web/docs/cameras.md' ; 
                kramdown 'web/docs/lights.md' ; 
                kramdown 'web/docs/prototypes.md' ; 
                kramdown 'web/docs/behaviors.md' ; 
                kramdown 'web/docs/animations.md' ; 
                kramdown 'web/docs/html.md' ; 
                kramdown 'web/docs/drivers.md' ; 
                kramdown 'web/docs/editor.md' ; 
                kramdown 'web/docs/query.md' ; 
                kramdown 'web/docs/cookbook.md' ; 
                kramdown 'web/docs/multiuser.md' ; 
                kramdown 'web/docs/simulation.md' ; 
                kramdown 'web/docs/2d-interface.md' ; 
                kramdown 'web/docs/materials.md' ; 
                kramdown 'web/docs/chat.md' ; 
                kramdown 'web/docs/sound.md' ; 
                kramdown 'web/docs/transforms.md' ; 
                kramdown 'web/docs/lesson.md' ; 
                kramdown 'web/docs/logging.md' ; 
                kramdown 'web/docs/persistence.md' ; 
                kramdown 'web/docs/testing.md' ; 
                kramdown 'web/docs/pitfalls.md' ; 
                kramdown 'web/docs/application.md' ; 
                kramdown 'web/docs/system.md' ; 
                cat web/format/docs.postamble ; cat web/format/postamble ) > 'web/documentation.html'"
        else # web/forum.md, web/downloads.md, web/unsupported.md
            sh "( cat web/format/preamble ; kramdown '#{md}' ; cat web/format/postamble ) > '#{ md.ext ".html" }'"
        end
    end

    # Render the demo page (web/catalog.html)

    FileList[ "web/catalog-template.html" ].each do |catalog|
        sh "( cat web/format/preamble ; cat '#{catalog}' ; cat web/format/postamble ) > 'web/catalog.html'"
    end

    # Restore the path.

    ENV["PATH"] = original_path

end
