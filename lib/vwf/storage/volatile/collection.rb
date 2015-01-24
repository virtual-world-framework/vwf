require_relative "item"

module VWF::Storage::Volatile

  module Collection

    def create id = nil, value = nil
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

    def each
      if block_given?
        storage.each { |item| yield item }
      else
        storage.each
      end
    end

    def reverse_each
      if block_given?
        storage.reverse_each { |item| yield item }
      else
        storage.reverse_each
      end
    end

    def size
      storage.size
    end

  private

    def storage
      @storage ||= {}
    end

  end

end
