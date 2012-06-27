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

require "tilt/template"
require "yaml"

module Tilt

  class VWFTemplate < Template

    def prepare
      @component = {}
    end

    def evaluate scope, locals, &block
      if callback = options[:callback]
        "#{callback}(#{ JSON.generate @component })"
      else
        JSON.generate @component
      end
    end

  end

  class VWFJSONTemplate < VWFTemplate

    def prepare
data.gsub!("\xEF\xBB\xBF", '')  # TODO: handle encodings properly
# TODO: catch parse errors
      @component = JSON.parse data.empty? ? "{}" : data  # receives empty string first time
    end

  end

  register "json", VWFJSONTemplate

  class VWFYAMLTemplate < VWFTemplate

    def prepare
      @component = YAML::load data
    end

  end

  register "yaml", VWFYAMLTemplate

end
