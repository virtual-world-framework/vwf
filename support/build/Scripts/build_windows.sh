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
# This script installs Virtual World Framework on Cygwin.
# Please visit https://github.com/virtual-world-framework/vwf/tree/master/support/build/Scripts
# and download the build_windows.sh file to execute. This script should then be executed at a Cygwin Prompt using:
# bash -x build_windows.sh
# Or for Proxy Environments:
# bash -x build_windows.sh --proxy ProxyAddress
###################################################################################################

set -e

# Install RubyGems for Cygwin
curl -O http://production.cf.rubygems.org/rubygems/rubygems-2.0.3.tgz 
tar xzf rubygems-2.0.3.tgz
cd rubygems-2.0.3
ruby setup.rb install
gem install bundler --no-ri --no-rdoc

# Download the latest VWF Master Branch Baseline to the local system
if [ -d "vwf" ];then
rm -rf vwf
fi
git clone http://www.github.com/virtual-world-framework/vwf  --recursive

# Download and Install Ruby Gems Referenced by VWF
cd vwf
bundle install

# Setup correct permissions for build support files
cd support/build
chmod 744 -R *

# Execute Build Process
cd ../../
bundle exec rake 

# Download, and Setup Ruby Thin Server Service
bundle exec thin start






