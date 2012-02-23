require "rake"
require "rake/clean"
require "tilt"


CLOBBER.include "index.html"


desc "Generate the catalog."

task :build => "index.html"

desc "Generate the catalog."

file "index.html" => "index.html.erb" do |task|

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
            file = File.new("#{path}/#{base}.catalog.yaml", "r")
            while (line = file.gets)
                descr = descr + line
            end
            file.close
        rescue => err
            # puts "Generating catalog... #{err}"
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
