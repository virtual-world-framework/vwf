require_relative "item"

module VWF::Storage

  class Collection

    attr_reader :container

    def initialize container = nil
      @container = container
    end

    def create id = nil, value = nil
      id, value = nil, id unless value || String === id
      type.new self, id, value            # POST /instances
    end

    def delete id ; end                   # DELETE  /instances/:instance

    def to_a ; [] ; end  # => Item[]      # GET /instances

    def [] id ; type.new self, id ; end  # => Item

    # TODO: []= ? and remove assignments within subclass taps?

    def type ; Item ; end

  end

end
