require_relative "item"

module VWF::Storage::CouchDB

  module Collection

    def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
      super.tap do |item|
        storage[ id ] = item
      end
    end

    def delete id
      storage.delete id
    end

    # def to_a
    #   storage # .to_a
    #   # storage.map do |id, item|
    #   #   { id, item.id } .merge item.get
    #   # end
    # end

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
