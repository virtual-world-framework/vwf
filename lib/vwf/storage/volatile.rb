require "vwf/storage"

class VWF < Sinatra::Base

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

      def initialize container = nil
        super
        @applications = {}
      end

      def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
        super.tap do |application|
          @applications[ id ] = application
        end
      end

      def delete id
        @applications.delete id
      end

      # def to_a
      #   @applications # .to_a
      #   # @applications.map do |id, application|
      #   #   { id, application.id } .merge application.get
      #   # end
      # end

      def [] id
        @applications[id]
      end

      def each &block
        @applications.each &block
      end

    end

    class Application < Storage::Application

      include Types

      def get
# component value
        @value
      end

      def set value
# component value
        @value = value
      end

    end

    class Instances < Storage::Instances

      include Enumerable
      include Types

      def initialize container = nil
        super
        @instances = {}
      end

      def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
        super.tap do |instance|
          @instances[ id ] = instance
        end
      end

      def delete id
        @instances.delete id
      end

      # def to_a
      #   @instances # .to_a
      #   # @instances.map do |id, instance|
      #   #   { id, instance.id } .merge instance.get
      #   # end
      # end

      def [] id
        @instances[id]
      end

      def each &block
        @instances.each &block
      end

    end

    class Instance < Storage::Instance
      include Types
    end

    class Revisions < Storage::Revisions

      include Enumerable
      include Types

      def initialize container = nil
        super
        @revisions = {}
      end

      def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
        super.tap do |revision|
          @revisions[ id ] = revision
        end
      end

      def delete id
        @revisions.delete id
      end

      # def to_a
      #   @revisions # .to_a
      #   # @revisions.map do |id, revision|
      #   #   { id, revision.id } .merge revision.get
      #   # end
      # end

      def [] id
        @revisions[id]
      end

      def each &block
        @revisions.each &block
      end

    end

    class Revision < Storage::Revision

      include Types

      def get
        @value
      end

      def set value
        @value = value
      end

    end

  end

end
