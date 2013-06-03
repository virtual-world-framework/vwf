# Generate components to test stack usage with varying descendant depth.
# 
#   descendants001.vwf.yaml -- node with a child
#   descendants002.vwf.yaml -- node with a child and a grandchild
#   descendants005.vwf.yaml -- node with descendants 5 deep
#   ...
#   descendants100.vwf.yaml -- node with descendants 100 deep
#
# See http://redmine.virtualworldframework.com/issues/2035.

require "erb"

class String 
  def hereblock
    gsub /^#{ scan( /^\s*/ ).min_by{ |l| l.length } }/, ""
  end
end

[ 1, 2, 5, 10, 25, 35, 50, 100 ].each do |n|

  File.open "descendants#{ "%03d" % n }.vwf.yaml", "w" do |component|
    
    component.puts <<-EOF.hereblock
      ---
    EOF

    (1..n).each do |j|

      component.puts <<-EOF.hereblock.gsub( /^/, ' ' * (j-1) * 4 )
        children:
          child:
            extends:
              http://vwf.example.com/node.vwf
      EOF

    end

  end
  
end
