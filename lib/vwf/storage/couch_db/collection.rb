require_relative "item"

module VWF::Storage::CouchDB

  module Collection

    # def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
    def create id = nil, value = nil  # TODO: actual id calculation, test for uniqueness if provided
      super
    end

    def delete id
    end

    def [] id
      begin
        type.new( self, id ).tap do |item|
          item.get  # throws if missing
        end
      rescue
        nil
      end
    end

    def []= id, value
      begin
        type.new( self, id ).tap do |item|
          item.set value  # throws if missing
        end
      rescue
        nil
      end
    end




#   collection members
#     [ container.dbid, type, member-sort ] => member ( app|inst|rev|act|tag )

# TODO: instance sort as id, not dbid






    def each

      startkey = [ container ? container.dbid : "", type.template[ "type" ] ]
      endkey = [ container ? container.dbid : "", type.template[ "type" ], {} ]

      db.view "_design/instance/_view/actions", :startkey => startkey, :endkey => endkey do |row|  # TODO: rename to "_design/collection/_view/members"
        unless row[ "total_rows" ]
# TODO: put name in documents?
id = row[ "id" ]
id[ /^.*\// ] = ""
          yield [ id, type.new( self, id ) ]
        end
      end

    end

  end

end
