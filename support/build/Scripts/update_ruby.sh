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
# This script installs the Ruby and Ruby Devkit framework on Cygwin.  
# Please visit https://github.com/virtual-world-framework/vwf/tree/master/support/build/Scripts
# This script should be automatically executed during a Rake Build of the VWF.
# Please note that if you are behind a Proxy, you need to set your proxy variable using:
# export http_proxy=http://proxy-server.mycorp.com:3128/
###################################################################################################

# Download the latest VWF Ruby and DevKit to the local system
if [ ! -d "../cache" ];then
		echo "If you are behind a proxy, please make sure your http_proxy variable is set for Cygwin. Otherwise, the build cannot continue. You may set your proxy using the bash command export http_proxy=http://proxy-server.mycorp.com:3128/
		
		"
		# Download Ruby 1.8.7 to Cache
		cd ..
		mkdir cache
		cd cache
		curl -k https://cloud.github.com/downloads/virtual-world-framework/vwf/ruby-1.8.7-p357-i386-mingw32.tar.gz --O ruby-1.8.7-p357-i386-mingw32.tar.gz --proxy $http_proxy
		tar -xvzf ruby-1.8.7-p357-i386-mingw32.tar.gz
		rm ruby-1.8.7-p357-i386-mingw32.tar.gz
		
		# Download DevKit to Cache
		curl -k https://cloud.github.com/downloads/virtual-world-framework/vwf/ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz --O ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz --proxy $http_proxy
		tar -xvzf ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz
		rm ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx.tar.gz
fi
