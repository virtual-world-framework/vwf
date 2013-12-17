#!/bin/bash

# Update the Version.js file with the latest Build Number from Jenkins. Build Number is provided by Jenkins. You may remove this if you are not using Jenkins, or update to your own CI environment variable.
sed -i "s/[0-9] \]/$BUILD_NUMBER \]/" support/client/lib/version.js

# Add Google Analytics Tracker ID here to indicate your own Google Analytics Account
sed -i "s/UA-xxxxxx-x/UA-30971226-1/g" config.ru
sed -i "s/# use Rack::/use Rack::/g" config.ru

bundle install
bundle exec rake 