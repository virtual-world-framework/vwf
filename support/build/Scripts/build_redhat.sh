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

#####################################################################################################################
# This script installs Virtual World Framework on a Red Hat Enterprise (RHEL) flavor of Linux.
# This script can be called from a shell prompt using:
# sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_redhat.sh  | bash
#####################################################################################################################

set -e


# Update the current yum library
sudo yum list updates
sudo yum -y update

# Install prerequisites on a new system
sudo yum -y install gcc-c++ gcc java rubygems git ruby-devel
wget http://ftp.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p392.tar.gz
tar xvzf ruby-1.9.3-p392.tar.gz
cd ruby-1.9.3-p392
./configure
make
make install
cd ..

# Upgrade RubyGems to the latest version and push upgrade to any Ruby Gems on the system
sudo gem update --system

# Install RubyGem Bundler used by VWF for Gem Management
sudo gem install bundler

# Download the latest VWF Master Branch Baseline to the local system
if [ -d "/var/www/vwf" ];then
sudo rm -rf /var/www/vwf
fi
sudo git clone http://github.com/virtual-world-framework/vwf /var/www/vwf --recursive --branch development

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
sudo mv /etc/rc.d/thin /etc/rc.d/init.d/thin
sudo /sbin/chkconfig --level 345 thin on
sudo thin config -C /etc/thin/vwf.yml -c /var/www/vwf -e production -p 80  -R /var/www/vwf/config.ru
sudo service thin stop
sudo service thin start
hostname=`hostname -s`

# Perform a check for iptables firewall and disable it to allow testing VWF is up and running
# Inform administrator that they need to open port 80 in their iptables configuration to allow VWF to run
# and to restart their service once this configuration item is complete.
SERVICE='iptables'
APPCHK=$(ps aux | grep -c $SERVICE)
if [ $APPCHK != '0' ];
then
sudo echo "IMPORTANT NOTE:"
sudo echo "IPTables has been detected. You will need to allow port 80 traffic. Please configure your iptables to allow port 80 traffic"
sudo echo "and restart your service. Your System is Now Running at http://$hostname but may be blocked."
else
sudo echo "Your System is Now Running at http://$hostname"
fi
