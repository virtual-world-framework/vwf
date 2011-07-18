require "rake"
require "rake/testtask"

Rake::TestTask.new do |test_task| 

    test_task.libs << "test"
    test_task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    test_task.verbose = true

end
