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

    def get ; end  # => value             # GET /instances/:instance
    def set value ; end                   # PUT /instances/:instance

    def id
      @id ||= newid
    end

    def newid
      SecureRandom.hex
    end

  end

end
