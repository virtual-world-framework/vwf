require "vwf/storage"
require_relative "couch_db/collection"

class VWF

  module Storage::Volatile

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

    class Applications < Storage::Applications
      include Types
      include Collection
      include Enumerable
    end

    class Application < Storage::Application
      include Types
      include Item
    end

    class Instances < Storage::Instances
      include Types
      include Collection
      include Enumerable
    end

    class Instance < Storage::Instance
      include Types
      include Item
    end

    class Revisions < Storage::Revisions
      include Types
      include Collection
      include Enumerable
    end

    class Revision < Storage::Revision
      include Types
      include Item
    end

    class States < Storage::States
      include Types
      include Collection
      include Enumerable
    end

    class State < Storage::State
      include Types
      include Item
    end

    class Actions < Storage::Actions
      include Types
      include Collection
      include Enumerable
    end

    class Action < Storage::Action
      include Types
      include Item
    end

  end

end
