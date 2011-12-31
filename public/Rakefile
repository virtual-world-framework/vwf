require "rake"
require 'rake/clean'
require "tilt"


CLOBBER.include "index.html"


desc "Build"

task :build => "index.html"

desc "Generate catalog"

file "index.html" => "index.html.erb" do |task|

    component_types = [ :json, :yaml ]
    image_types = [ :png, :jpg, :gif ]

    patterns = component_types.map { |type| "**/*.vwf.#{type}" }

    applications = FileList.new( patterns ).sort.map do |file|

        path, name = File.split file

        ext = File.extname name
        base = File.basename name, ext

        type = image_types.find do |type|
            File.exist? "#{path}/#{base}.#{type}"
        end

        [
            ( base == "index.vwf" ? path : file ),
            type && "#{path}/#{base}.#{type}",
            path
        ]

    end .select do |application, image, name|

        image

    end

    File.open( task.name, "w" ) do |io|
        io.write Tilt.new( task.prerequisites.first ).
            render Object.new, :applications => applications
    end

end
