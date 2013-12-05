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
# This script installs Virtual World Framework on a Debian (Ubuntu) flavor of Linux.
# This script can be called from a shell prompt using: 
# sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh  | bash
###################################################################################################

set -e

# Install prerequisites on a new Debian system
# Update the current apt-get library
sudo apt-get update

# Install Java, Ruby, RubyGems, and Git 
sudo apt-get -y install openjdk-7-jdk rubygems git
sudo apt-get -y install libxslt-dev libxml2-dev
sudo apt-get -y install ruby1.9.1 ruby1.9.1-dev rubygems1.9.1 irb1.9.1 ri1.9.1 rdoc1.9.1 build-essential libopenssl-ruby1.9.1 libssl-dev zlib1g-dev
sudo update-alternatives --install /usr/bin/ruby ruby /usr/bin/ruby1.9.1 400 \
         --slave   /usr/share/man/man1/ruby.1.gz ruby.1.gz \
                        /usr/share/man/man1/ruby1.9.1.1.gz \
        --slave   /usr/bin/ri ri /usr/bin/ri1.9.1 \
        --slave   /usr/bin/irb irb /usr/bin/irb1.9.1 \
        --slave   /usr/bin/rdoc rdoc /usr/bin/rdoc1.9.1
		
# Upgrade RubyGems to the latest version and push upgrade to any Ruby Gems on the system
sudo gem install rubygems-update
sudo update_rubygems

# Install RubyGem Bundler used by VWF for Gem Management
sudo gem install bundler

# Download the latest VWF Master Branch Baseline to the local system
if [ -d "/var/www/vwf" ];then
sudo rm -rf /var/www/vwf
fi
sudo git clone http://www.github.com/virtual-world-framework/vwf /var/www/vwf --recursive

# Download and Install Ruby Gems Referenced by VWF
cd /var/www/vwf
sudo bundle install

# Setup correct permissions for build support files
cd /var/www/vwf/support/build
sudo chmod 744 -R *

# Execute Build Process
cd /var/www/vwf
sudo bundle exec rake 

# Download, and Setup Ruby Thin Server Service 
# Ruby Thin is configured to install on port 80 and auto-start on reboot
# Log file output is located at: /var/www/vwf/log

sudo gem install thin
sudo thin install
sudo /usr/sbin/update-rc.d -f thin defaults
sudo bundle exec thin config -C /etc/thin/vwf.yml -c /var/www/vwf -e production -p 80 -R /var/www/vwf/config.ru
sudo service thin stop
sudo service thin start
hostname=`hostname -s`
sudo echo "Your System is Now Running at http://$hostname" 

