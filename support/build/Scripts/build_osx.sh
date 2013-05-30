#!/bin/bash
# Copyright 2013 United States Government, as represented by the Secretary of Defense, Under
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
# This script installs Virtual World Framework on Apple OS X 
# This script can be called from a shell prompt using: 
# sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_osx.sh | bash
###################################################################################################

# Install Ruby using RVM
\curl -L https://get.rvm.io | bash -s stable --autolibs=homebrew
source ~/.rvm/scripts/rvm
rvm install 1.9.3-p392
rvm use 1.9.3-p392

# Upgrade RubyGems to the latest version and push upgrade to any Ruby Gems on the system
gem install rubygems-update
update_rubygems

# Install RubyGem Bundler used by VWF for Gem Management
gem install bundler

# Download the latest VWF Master Branch Baseline to the local system
if [ ! -d "/var/www" ]; then
  sudo mkdir /var/www
fi

if [ -d "/var/www/vwf" ];then
  sudo rm -rf /var/www/vwf
fi
sudo git clone http://www.github.com/virtual-world-framework/vwf /var/www/vwf --recursive

# Download and Install Ruby Gems Referenced by VWF
cd /var/www/vwf
bundle install

# Setup correct permissions for build support files
sudo chmod -R 744 /var/www/vwf/support/build

# Execute Build Process
cd /var/www/vwf
sudo bundle exec rake

# Run Thin From VWF Bundle

bundle exec thin start
hostname=`hostname -s`
echo "Your System is Now Running at http://$hostname:3000" 
echo "To start VWF in the future please launch Terminal, Navigate to /var/www/vwf, and type: bundle exec thin start" 
