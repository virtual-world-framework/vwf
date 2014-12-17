#!/bin/bash   


if [ -d "/cygdrive/c/vwf" ]; then
	rm -rf /cygdrive/c/vwf
	rm -rf /cygdrive/c/vwfsource
fi

git clone --recursive http://www.github.com/virtual-world-framework/vwf vwf

git clone --recursive http://www.github.com/virtual-world-framework/vwf vwfsource

rm -rf /cygdrive/c/vwf/.git
rm -rf /cygdrive/c/vwfsource/.git

# Get Version File Ready For Windows Zip File Naming
cat /cygdrive/c/vwf/support/client/lib/version.js | while read line;
do
if [[ "$line" == *return* ]]
then
temp1=${line#*[*};
temp2=${temp1%*]*};
temp2=${temp2//[[:space:]]};
temp2=${temp2//,/.};
echo $temp2 > /cygdrive/c/version.txt;
fi;
done





cd vwf
git submodule init
git submodule update
bundle install
bundle exec rake

# mkdir node
# cd node
# wget http://nodejs.org/dist/latest/node.exe
# wget http://nodejs.org/dist/npm/npm-1.3.25.zip

