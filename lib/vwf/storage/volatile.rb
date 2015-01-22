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
      include Enumerable
      include Types
      include Collection
    end

    class Application < Storage::Application
      include Types
      include Item
    end

    class Instances < Storage::Instances
      include Enumerable
      include Types
      include Collection
    end

    class Instance < Storage::Instance
      include Types
      # include Item -- no direct storage; Storage::Instance delegates to revisions
    end

    class Revisions < Storage::Revisions
      include Enumerable
      include Types
      include Collection
    end

    class Revision < Storage::Revision
      include Types
      include Item
    end

  end

end
