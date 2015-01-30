require "securerandom"

module VWF::Storage

  class Item

    attr_reader :collection

    def initialize collection, id = nil, value = nil
      @collection = collection
      @id = id
      yield if block_given?
      set value if value
    end

    def get ; end  # => value                                   # GET /instances/:instance
    def set value ; end                                         # PUT /instances/:instance

    def id
      @id ||= collection.send :newid
    end

  end

end
