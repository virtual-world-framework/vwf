module VWF::Storage::CouchDB

  module Item

    def get
      load
      document[ "value" ]
    end

    def set value
      value.tap do |value|
        document[ "value" ] = value
        save
      end
    end

    def load
      self.document = db.get dbid  # TODO: note: throws if missing  # TODO: use document= (isn't working)
    end

    def save
      document.id ||= dbid
      document.save
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
      {}
    end

    def dbid
      if id
        if collection.container
          collection.container.dbid + "/" + id
        else
          id
        end
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
