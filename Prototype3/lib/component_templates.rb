require "tilt/template"
require "yaml"

class ComponentTemplate < Tilt::Template

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

class JSONComponentTemplate < ComponentTemplate

  def prepare
data.gsub!("\xEF\xBB\xBF", '')  # TODO: handle encodings properly
# TODO: catch parse errors
    @component = JSON.parse data.empty? ? "{}" : data  # receives empty string first time
  end

end

Tilt.register "json", JSONComponentTemplate

class YAMLComponentTemplate < ComponentTemplate

  def prepare
    @component = YAML::load data
  end

end

Tilt.register "yaml", YAMLComponentTemplate
