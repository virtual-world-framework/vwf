require "rake"
require "rake/testtask"
require 'rake/clean'


# Delegate the standard tasks to any child projects.

DELEGATED_TASKS = [ :build, :test, :clean, :clobber ]

FileList[ "*/Rakefile", "*/*/Rakefile" ].map do |rakefile| # could use "*/**/Rakefile" to reach an arbitrary depth

    rakefile[ %r{(.*)/Rakefile}, 1 ]

end .each do |project|

    # Create a namespace for each child project.

    namespace = namespace project.gsub "/", "-" do

        # Create tasks delegating to the child project's rake.

        DELEGATED_TASKS.each do |name|
            task name do |task|
                chdir project do
                    rake name.to_s
                end
            end        
        end

    end

    # Make the parent tasks dependent on the child tasks.

    DELEGATED_TASKS.each do |name|
        task name => namespace[name]
    end

end

# Invoke a child rake.

def rake *args
  ruby "-S", "rake", *args
end


# Create the test task.

Rake::TestTask.new do |task| 

    task.libs << "test"
    task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    task.verbose = true

end




# Test for trailing newline

# vwf@vwf:~/vwf/branches/integration/public/types$ tail -c 1 material.vwf.yaml | od -a
# 0000000  nl
# 0000001


# Test against server

# curl --silent --head --fail "http://166.27.115.155:3000/types/material.vwf/77103a5888ada488/material.vwf" --output /dev/null

# for i in `find . -name '*.vwf.yaml' -o -name '*.vwf.json' | perl -nle 'print $1 if m|\./(.*)\.(yaml\|json)$|'` ; do curl --silent --head --fail "http://166.27.115.155:3000/$i" --output /dev/null || echo "$i bad"; done
