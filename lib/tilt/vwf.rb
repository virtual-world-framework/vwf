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
