require "rake"
require "rake/clean"
require "tilt"
require "yaml"


CLOBBER.include "web/**/*.html"


task :default => [ :clean, :clobber, :build ]

desc "Generate the catalog and documentation."

task :build => "web/catalog.html" do

    original_path = ENV["PATH"]
    ENV["PATH"] = FileList[ "../support/build/*" ].join( ":" ) + ":" + ENV["PATH"]

    FileList[ "web/*.md" ].each do |md|
        sh "( cat web/format/preamble ; Markdown.pl '#{md}' ; cat web/format/postamble ) > '#{ md.ext ".html" }'"
    end

    FileList[ "web/docs/**/*.md" ].each do |md|
        sh "( cat web/docs/format/preamble ; Markdown.pl '#{md}' ; cat web/docs/format/postamble ) > '#{ md.ext ".html" }'"
    end

    sh "bundle exec rocco web/docs/application/*.vwf.yaml"
    sh "bundle exec rocco web/docs/application/example.js"
    
    ENV["PATH"] = original_path

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
