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
      item = type.new( self, id )
      item.get ? item : nil
    end

    def each minid = nil, maxid = nil
      if block_given?
        query( minid, maxid, :descending => false ) { |item| yield item }
      else
        super
      end
    end

    def reverse_each minid = nil, maxid = nil
      if block_given?
        query( minid, maxid, :descending => true ) { |item| yield item }
      else
        super
      end
    end

    def size minid = nil, maxid = nil
      query( minid, maxid, :reduce => true )
    end

  private

    def query minid = nil, maxid = nil, options = {}

      reduction = nil

      query_options = {
        :descending => false,
        :reduce => false
      }

      query_options.merge! options

      minkey = [
        container ? container.send( :dbid ) : "",
        dbtype,
        minid ? sortid( minid ) : nil
      ]

      maxkey = [
        container ? container.send( :dbid ) : "",
        dbtype,
        maxid ? sortid( maxid ) : "\uFFFF"
      ]

      if query_options[ :descending ]
        query_options.merge! :startkey => maxkey, :endkey => minkey
      else
        query_options.merge! :startkey => minkey, :endkey => maxkey
      end

      db.view "#{DESIGN_DOCUMENT_ID}/_view/members", query_options do |row|

        if query_options[ :reduce ]

          # {
          #   "key" => nil,
          #   "value" => 10                                             # Reduction result = count
          # }

          reduction = row[ "value" ]

        else

          # {
          #   "id" => "/duck/index.vwf/instance/1234",                  # CouchDB document id
          #   "key" => [ "/duck/index.vwf", "instance", 1234 ],         # Query key mapping to document: container-id, type, item-id
          #   "value" => {                                              # Query `value` = the document
          #     "_id" => "/duck/index.vwf/instance/1234",
          #     "_rev" => "1-abcd",
          #     "type" => "instance",
          #     "application" => "/duck/index.vwf",
          #     "value" => { ... }                                      # Document `value` = the item
          #   }
          # }

          item = type.new self,
            row[ "key" ].last.to_s,
            row[ "value" ][ "value" ],
            row[ "value" ][ "_rev" ]

          yield [ item.id, item ]

        end

      end

      reduction

    end

    def dbtemplate
      if container
        { container.send( :dbtype ) => container.send( :dbid ), "type" => dbtype }
      else
        { "type" => dbtype }
      end
    end

    def dbtype
      type.name.split( "::" ).last.downcase
    end

    def dbid
      if container
        container.send( :dbid ) + "/" + dbtype
      end
    end

    def newid
      tempdoc = CouchRest::Document.new
      tempdoc.database = db
      tempdoc.save
      id = tempdoc.id
      tempdoc.destroy
      id
    end

  end

end
