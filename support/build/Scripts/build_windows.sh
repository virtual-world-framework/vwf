#!/bin/bash
# Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
# Secretary of Defense (Personnel & Readiness).
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

###################################################################################################
# This script installs Virtual World Framework on Cygwin
# This script can be called from a shell prompt using: 
# curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_windows.sh  | bash OptProxyAddress
###################################################################################################

set -e

# Install RubyGems for Cygwin
curl -s http://production.cf.rubygems.org/rubygems/rubygems-1.8.24.tgz --proxy $1 | tar xz
cd rubygems-1.8.24
ruby setup.rb install 
gem install bundler --no-ri --no-rdoc

# Download the latest VWF Master Branch Baseline to the local system
if [ -d "/var/www/vwf" ];then
rm -rf /var/www/vwf
fi
git config --global http.proxy $1
git clone http://www.github.com/virtual-world-framework/vwf /var/www/vwf

# Download and Install Ruby Gems Referenced by VWF
cd /var/www/vwf
cd /var/www/vwf/support/build
curl -k https://cloud.github.com/downloads/virtual-world-framework/vwf/ruby-1.8.7-p357-i386-mingw32.tar.gz --proxy $1 --O ruby-1.8.7-p357-i386-mingw32.tar.gz
tar -xvzf ruby-1.8.7-p357-i386-mingw32.tar.gz
curl -k https://cloud.github.com/downloads/virtual-world-framework/vwf/ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz --proxy $1 --O ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz
tar -xvzf ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz


cd /var/www/vwf
bundle install
bundle install --binstubs

# Setup correct permissions for build support files
cd /var/www/vwf/support/build
chmod 744 -R *

# Execute Build Process
cd /var/www/vwf
bundle exec rake build

# Download, and Setup Ruby Thin Server Service 
thin start 