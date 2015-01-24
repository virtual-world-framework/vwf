require_relative "item"

module VWF::Storage::Volatile

  module Collection

    def create id = nil, value = nil  # TODO: actual id calculation, test for uniqueness if provided
      super.tap do |item|
        storage[ item.id ] = item
      end
    end

    def delete id
      storage.delete id
    end

    def to_a
      storage.to_a
    end

    def to_h
      storage.to_h
    end

    def [] id
      storage[ id ]
    end

    def each &block
      storage.each &block
    end

  private

    def storage
      @storage ||= {}
    end

  end

end
