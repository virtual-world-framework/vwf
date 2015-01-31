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

  private

    def load
      self.document = db.get dbid  # TODO: note: throws if missing
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
        document.merge! collection.send( :dbtemplate )
      end
    end

    def document= value
      @document = value
    end

    def dbtype
      collection.send( :dbtype )
    end

    def dbid
      dbid = collection.send( :dbid )
      dbid ? dbid + "/" + id : id
    end

  end

end
