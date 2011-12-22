require "rake"
require "rake/testtask"

Rake::TestTask.new do |test_task| 

    test_task.libs << "test"
    test_task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    test_task.verbose = true

end

desc "Build"

task :build do |task|
	
end

file "public/index.html" => "public/index.html.erb" do |task|

	component_types = [ :json, :yaml ]
	image_types = [ :png, :jpg, :gif ]

	patterns = component_types.map { |type| "public/**/*.vwf.#{type}" }

	applications = FileList.new( patterns ).sort.map do |file|

		path, name = File.split file

		ext = File.extname name
		base = File.basename name, ext

		type = image_types.find do |type|
			File.exist? "#{path}/#{base}.#{type}"
		end

		file.sub! /^public\//, ""
		path.sub! /^public\//, ""


		[
			( base == "index.vwf" ? path : file ),
			type && "#{path}/#{base}.#{type}",
			path
		]

	end .select do |application, image, name|

		image

	end

	require "tilt"

	File.open( task.name, "w" ) do |io|
		io.write Tilt.new( task.prerequisites.first ).
			render Object.new, :applications => applications
	end

end

task :build => [ "public/index.html" ]
