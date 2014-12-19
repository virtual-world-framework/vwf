#!/bin/bash   


if [ -d "/cygdrive/c/vwf" ]; then
	rm -rf /cygdrive/c/vwf
	rm -rf /cygdrive/c/vwfsource
fi

git clone --branch integration --recursive http://www.github.com/virtual-world-framework/vwf vwf

git clone --branch integration --recursive http://www.github.com/virtual-world-framework/vwf vwfsource

rm -rf /cygdrive/c/vwf/.git
rm -rf /cygdrive/c/vwfsource/.git

# Get Version File Ready For Windows Zip File Naming
cat /cygdrive/c/vwf/support/client/lib/version.js | /cygdrive/c/vwf/support/deployment/version.sh > /cygdrive/c/version.txt





cd vwf
git submodule init
git submodule update
bundle install
JENKINS_HOME=1 JOB_NAME=integration BUILD_NUMBER=0 bundle exec rake

# mkdir node
# cd node
# wget http://nodejs.org/dist/latest/node.exe
# wget http://nodejs.org/dist/npm/npm-1.3.25.zip

