module VWF::Storage::CouchDB

  module Item

    def get
      @value
    end

    def set value
      @value = value
    end

  end

end
