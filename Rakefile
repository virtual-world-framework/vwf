require "rake"
require "rake/testtask"
require "tilt"


def rake *args
  ruby "-S", "rake", *args
end


Rake::TestTask.new do |test_task| 

    test_task.libs << "test"
    test_task.test_files = FileList[ "test/*_test.rb", "test/*/*_test.rb" ]

    test_task.verbose = true

end


desc "Build"

task :build do |task|

    chdir "support/client" do
        rake task.name
    end

    chdir "public" do
        rake task.name
    end

end


desc "Clean"

task :clean do |task|

    chdir "support/client" do
        rake task.name
    end

    chdir "public" do
        rake task.name
    end

end




# Test for trailing newline

# vwf@vwf:~/vwf/branches/integration/public/types$ tail -c 1 material.vwf.yaml | od -a
# 0000000  nl
# 0000001


# Test against server

# curl --silent --head --fail "http://166.27.115.155:3000/types/material.vwf/77103a5888ada488/material.vwf" --output /dev/null

# for i in `find . -name '*.vwf.yaml' -o -name '*.vwf.json' | perl -nle 'print $1 if m|\./(.*)\.(yaml\|json)$|'` ; do curl --silent --head --fail "http://166.27.115.155:3000/$i" --output /dev/null || echo "$i bad"; done


# https://github.com/jrburke/r.js
# OS X/Linux/Unix:
# java -classpath path/to/rhino/js.jar:path/to/closure/compiler.jar org.mozilla.javascript.tools.shell.Main r.js main.js
# Windows
# java -classpath path/to/rhino/js.jar;path/to/closure/compiler.jar org.mozilla.javascript.tools.shell.Main r.js main.js

# java -classpath bin/js.jar\;bin/compiler.jar org.mozilla.javascript.tools.shell.Main bin/r.js -o build.js


# java -jar compiler.jar --js hello.js --js_output_file hello-compiled.js
# java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js hello.js
