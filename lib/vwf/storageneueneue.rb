require_relative "storage/collection"

module VWF::Storage

  module Types
    def Applications ; Applications ; end
    def Application ; Application ; end
    def Instances ; Instances ; end
    def Instance ; Instance ; end
    def Revisions ; Revisions ; end
    def Revision ; Revision ; end
    def Actions ; Actions ; end
    def Action ; Action ; end
  end

  class Applications < Collection
    include Types
    def type ; self.Application ; end
  end

  class Application < Item
    include Types
    def instances ; @instances ||= self.Instances.new self ; end
    def tags ; @tags ||= self.Tags.new self ; end
  end

  class Instances < Collection
    include Types
    def type ; self.Instance ; end
  end

  class Instance < Item
    include Types
    def revisions ; @revisions ||= self.Revisions.new self ; end
    def actions ; @actions ||= self.Actions.new self ; end
    def tags ; @tags ||= self.Tags.new self ; end
  end

  class Revisions < Collection

    include Types
    def type ; self.Revision ; end

    def create id, value
      super.tap do |revision|
        if ! revision.id && revision.get  # TODO: don't do a database read for value since we just had it
          revision.id = revision.get["kernel"]["time"].to_s
        end
      end
    end

    def current
      if last = to_a.last  # TODO optimize for non-hash storage
        last[1]
      end
    end

  end

  class Revision < Item
    include Types
    def tags ; @tags ||= self.Tags.new self ; end
  end

  class Actions < Collection
    include Types
    def type ; self.Action ; end
  end

  class Action < Item
    include Types
  end

  class Tags < Collection
    include Types
    def type ; self.Tag ; end
  end

  class Tag < Item
    include Types
  end

end
