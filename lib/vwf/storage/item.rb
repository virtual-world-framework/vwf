module VWF::Storage

  class Item

    attr_reader :collection

    def initialize collection, id = nil, value = nil
      @collection = collection
      @id = id
      set value if value
    end

    def get ; end  # => value             # GET /instances/:instance
    def set value ; end                   # PUT /instances/:instance

    def id
      @id ||= newid
    end

    def newid
      rand( 1000 ).to_s  # TODO: actual id calculation, test for uniqueness if provided
    end

  end

end
