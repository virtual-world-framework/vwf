# Generate components to test stack usage with varying children.
# 
#   children3x3.vwf.yaml -- node with 3 children, each with 3 children
#   children5x5.vwf.yaml -- node with 5 children, each with 5 children
#   children10x10.vwf.yaml -- node with 10 children, each with 10 children
# 
#   children10.vwf.yaml -- node with 10 children
#   children25.vwf.yaml -- node with 25 children
#   children100.vwf.yaml -- node with 100 children
#
# See http://redmine.virtualworldframework.com/issues/2035.

require "erb"

class String 
  def hereblock
    gsub /^#{ scan( /^\s*/ ).min_by{ |l| l.length } }/, ""
  end
end

[ 3, 5, 10 ].each do |n|

  File.open "children#{n}x#{n}.vwf.yaml", "w" do |component|
    
    component.puts ERB.new( <<-EOF.hereblock, nil, "<>-" ).result binding
      ---
      children:
        <%- (1..n).each do |i| -%>
        child<%= "%03d" % i %>:
          children:
            <%- (1..n).each do |j| -%>
            child<%= "%03d" % j %>:
              extends: http://vwf.example.com/node.vwf
            <%- end -%>
        <%- end -%>
    EOF

  end
  
end

[ 10, 25, 100 ].each do |n|

  File.open "children#{ "%03d" % n }.vwf.yaml", "w" do |component|
    
    component.puts ERB.new( <<-EOF.hereblock, nil, "<>-" ).result binding
      ---
      children:
        <%- (1..n).each do |j| -%>
        child<%= "%03d" % j %>:
          extends: http://vwf.example.com/node.vwf
        <%- end -%>
    EOF

  end
  
end
