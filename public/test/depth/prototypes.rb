# Generate components to test stack usage with varying prototype chains.
# 
#   prototypes001.vwf.yaml -- node with a 1-deep prototype chain
#   ...
#   prototypes250.vwf.yaml -- node with a 250-deep prototype chain
#
# See http://redmine.virtualworldframework.com/issues/2035.

(1..250).each do |n|

  File.open "prototypes#{ "%03d" % n }.vwf.yaml", "w" do |component|
    if n == 1
      component.puts <<-EOF.gsub( /^ {8}/, '' )
        ---
        extends: http://vwf.example.com/node.vwf
      EOF
    else
      component.puts <<-EOF.gsub( /^ {8}/, '' )
        ---
        extends: prototypes#{ "%03d" % (n-1) }.vwf
      EOF
    end
  end

end
