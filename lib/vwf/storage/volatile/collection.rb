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

    def each minid = nil, maxid = nil
      if block_given?
        selection( minid, maxid ).each { |item| yield item }
      else
        super
      end
    end

    def reverse_each minid = nil, maxid = nil
      if block_given?
        selection( minid, maxid ).reverse_each { |item| yield item }
      else
        super
      end
    end

    def size minid = nil, maxid = nil
      selection( minid, maxid ).size
    end

  private

    def storage
      @storage ||= {}
    end

    def selection minid = nil, maxid = nil
      if minid || maxid
        range = ( minid ? sortid( minid ) : -Float::INFINITY ) ..
          ( maxid ? sortid( maxid ) : Float::INFINITY )
        storage.select do |id, item|
          range === sortid( id )
        end
      else
        storage
      end
    end

  end

end
