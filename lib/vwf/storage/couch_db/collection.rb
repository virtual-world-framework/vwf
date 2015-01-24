require_relative "item"

module VWF::Storage::CouchDB

  module Collection

    def create id = nil, value = nil
      super
    end

    def delete id
      self[ id ].delete
    end

    def to_a
      each.map { |item| item[ 1 ] }
    end

    def to_h
      each.map { |item| item }
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

    def each
      if block_given?
        query( :descending => false ) { |item| yield item }
      else
        return enum_for :each
      end
    end

    def reverse_each
      if block_given?
        query( :descending => true ) { |item| yield item }
      else
        return enum_for :reverse_each
      end
    end

    def size
      query( :reduce => true )
    end

  private

    def query options = {}

      reduction = nil

      query_options = {
        :descending => false,
        :reduce => false
      }

      query_options.merge! options

      key = [
        container ? container.dbid : "",
        type.template[ "type" ]
      ]

      if query_options[ :descending ]
        startkey = key + [ {} ]
        endkey = key
      else
        startkey = key
        endkey = key + [ {} ]
      end

      query_options.merge! :startkey => startkey, :endkey => endkey

      db.view "#{DESIGN_DOCUMENT_ID}/_view/members", query_options do |row|

        if query_options[ :reduce ]

          # {
          #   "key" => nil,
          #   "value" => 10                                             # Reduction result = count
          # }

          reduction = row[ "value" ]

        else

          # {
          #   "id" => "/duck/index.vwf/1234",                           # CouchDB document id
          #   "key" => [ "/duck/index.vwf", "instance", "1234" ],       # Query key mapping to document
          #   "value" => {                                              # Query value = the document
          #     "_id" => "/duck/index.vwf/1234",
          #     "_rev" => "1-abcd",
          #     "type" => "instance",
          #     "application" => "/duck/index.vwf",
          #     "value" => { ... }                                      # The document's item value
          #   }
          # }

id = row[ "id" ] ; id[ /^.*\// ] = ""  # TODO: put name in documents?  # TODO: instance sort as id, not dbid
          yield [ id, type.new( self, id, row[ "value" ][ "value" ], row[ "value" ][ "_rev" ] ) ]

        end

      end

      reduction

    end

  end

end
