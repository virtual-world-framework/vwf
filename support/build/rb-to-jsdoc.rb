# Convert "///" comment blocks to JSDoc-style /** ... */ blocks. Invoke as:
# 
#   ruby -p -i.bak js-to-jsdoc.rb file ...
# 
# to convert a set of files in place.

case ( state ||= 0 ) + ( %r{^\s*##([^#]|$)}.match( $_ ) ? 1 : 0 )
    when 1  # entering block
        last = $_
        sub %r{##}, "/**"
        gsub %r{\*/}, "* /"
        state = 2
    when 3  # in block
        last = $_
        sub %r{##}, " * "
        gsub %r{\*/}, "* /"
    when 2  # leaving block
        puts last.sub %r{##.*}, " */"
        state = 0
end
