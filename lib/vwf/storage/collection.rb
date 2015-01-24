require_relative "item"

module VWF::Storage

  class Collection

    attr_reader :container

    def initialize container = nil
      @container = container
    end

    def create id = nil, value = nil
      id, value = nil, id unless value || String === id
      type.new self, id, value                                  # POST /collection
    end

    def delete id ; end                                         # DELETE  /collection/:item

    def to_a ; [] ; end  # => [ Item, Item, ... ]               # GET /collection
    def to_h ; {} ; end  # => { id: Item, id: Item, ... }       # GET /collection

    def [] id ; end  # => Item                                  # GET /collection/:item

    def type ; Item ; end

  end

end
