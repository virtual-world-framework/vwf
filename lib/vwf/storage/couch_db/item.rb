module VWF::Storage::CouchDB

  module Item

    def get
      load
      document[ "value" ]
    end

    def set value
      document[ "value" ] = value
      save
      value
    end

    def load
      if dbid  # TODO: else?
        @document = db.get( dbid )  # TODO: note: throws if missing  # TODO: use document= (isn't working)
      end
    end

    def save
      unless dbid
        document.save
        @id = document.id
        document.copy( dbid )
        document.destroy
      else
        document.id = dbid
        document.save
      end
    end

    def document
      @document ||= CouchRest::Document.new.tap { |document|
        document.database = db
        document.merge! template
        # document.merge! self.class.template
      }
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

    # def id= value
    #   @id = value
    # end

  end

end
