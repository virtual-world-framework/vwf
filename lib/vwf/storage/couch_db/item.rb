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

    def load  # TODO private
      self.document = db.get dbid  # TODO: note: throws if missing  # TODO: use document= (isn't working)
    end

    def save  # TODO private
      document.id ||= dbid
      document.save
    end

    def delete  # TODO private
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
        { "type" => dbtype }
      else
        { "type" => dbtype, collection.container.dbtype => collection.container.dbid }
      end
    end

    def dbid
      if id
        unless collection.container
          id
        else
          collection.container.dbid + "/" + dbtype + "/" + id
        end
      end
    end

    def dbtype
      self.class.dbtype
    end

    module ClassMethods
      def dbtype
        name.split( "::" ).last.downcase
      end
    end

    # Define `Item.dbtype`.

    self.extend ClassMethods

    # Define `dbtype` in the classes that `include Item`: `Application.dbtype`, etc.

    def self.included base
      base.extend ClassMethods
    end

  end

end
