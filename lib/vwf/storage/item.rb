module VWF::Storage

  class Item

    attr_reader :collection  # , :id
attr_accessor :id  # TODO: for testing

    def initialize collection, id, value = nil
      @collection = collection
      @id = id
      set value if value
    end

    def get ; end  # => value             # GET /instances/:instance
    def set value ; end                   # PUT /instances/:instance

  end

end
