module VWF::Storage::CouchDB

  module Item

    def initialize collection, id = nil, value = nil, rev = nil
      super collection, id, value do
        document[ "_rev" ] = rev if rev
      end
    end

    def get
      load unless document.rev
      document[ "value" ]
    end

    def set value
      value.tap do |value|
        document[ "value" ] = value
        save unless document.rev
      end
    end

    def load
      self.document = db.get dbid  # TODO: note: throws if missing  # TODO: use document= (isn't working)
    end

    def save
      document.id ||= dbid
      document.save
    end

    def delete
      document.destroy
    end

    def document
      @document ||= CouchRest::Document.new.tap do |document|
        document.database = db
        document.merge! template
      end
    end

    def document= value
      @document = value
    end

    def template
      unless collection.container
        { "type" => type( self ) }
      else
        { "type" => type( self ), type( collection.container ) => collection.container.dbid }
      end
    end

    def dbid
      if id
        unless collection.container
          id
        else
          collection.container.dbid + "/" + id
        end
      end
    end

    def type item
      item.class.name.split( "::" ).last.downcase
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
