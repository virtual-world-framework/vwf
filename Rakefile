require "rake"
require "rake/testtask"
require "tilt"


# == test ==========================================================================================

Rake::TestTask.new do |test_task| 

    test_task.libs << "test"
    test_task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    test_task.verbose = true

end


# == build =========================================================================================

desc "Build"

task :build => [ :client, :public ]


# == public ========================================================================================

desc "Build public"

task :public do |task|

    chdir "public" do
        Rake::Task["index.html"].invoke
    end
    
end

desc "Build public -- generate catalog"

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


# == support/client ================================================================================

desc "Build client"

task :client do |task|

    chdir "support/client" do
        Rake::Task["compile"].invoke
    end
    
end

desc "Build client -- compile"

task :compile => "build.js" do |task|

    sh <<-SH.strip.gsub %r{ +}, " "
        java -classpath bin/js.jar\\;bin/compiler.jar \
            org.mozilla.javascript.tools.shell.Main bin/r.js -o build.js
    SH

end

desc "Build client -- generate compilation script"

file "build.js" => "build.js.erb" do |task|

    modules = []

    chdir "lib" do
        
        patterns = [ "vwf.js", "vwf/*.js", "vwf/*/*.js", "vwf/*/stage/*.js" ]

        modules = FileList.new( patterns ).sort.map do |file|
            file.sub %r{\.js$}, ""
        end

    end

    File.open( task.name, "w" ) do |io|
        io.write Tilt.new( task.prerequisites.first ).
            render Object.new, :modules => modules
    end

end
