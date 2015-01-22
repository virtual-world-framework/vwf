module VWF::Storage::Volatile

  module Item

    def get
      @value
    end

    def set value
      @value = value
    end

  end

end
