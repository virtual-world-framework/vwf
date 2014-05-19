#!/bin/bash

# Update the Version.js file with the latest Build Number from Jenkins. 
# Build Number is provided by Jenkins. You may remove this if you are 
# not using Jenkins, or update to your own CI environment variable.
sed -i "s/[0-9] \]/$BUILD_NUMBER \]/" support/client/lib/version.js

bundle install
bundle exec rake 