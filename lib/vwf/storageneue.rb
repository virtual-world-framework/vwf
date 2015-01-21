


# /photos               photos#index        GET                 display a list of all photos

# /photos               photos#create       POST                 create a new photo
# /photos/:id           photos#show         GET                display a specific photo
# /photos/:id           photos#update       PATCH/PUT               update a specific photo
# /photos/:id           photos#destroy      DELETE                  delete a specific photo


# /photos/new           photos#new          GET                 return an HTML form for creating a new photo
# /photos/:id/edit      photos#edit         GET                return an HTML form for editing a photo




# /path/to/application.vwf launch from filesystem => find or create application in database with given id
# new instance: from application database, allocate new id and create new instance


# new ids:
#   - application
#     - either resource, which is unique from the filesystem, or
#     - database-assigned unique id with separate resource field which must also be unique
#   - instance
#     - reflector-generated id, short or long, random or not, which must be unique within the application, or
#     - database-assigned unique id with or without separate resource field which must also be unique
#     - instances are unordered
#     - from an application, create a new instance with the ??? id ???; easiest to use as the id
#   - revision
#     - reflector-generated timestamp or sequence number, which must be unique within the instance, or
#     - database-assigned unique id with the time inside the state data
#     - revisions are ordered
#     - from an instance, create a new revision with the given unique time; easiest to use as the id

# create with requested id
# if requested id not provided, assign a unique id

#   - application launch
#      - applications.get "path/to/application/index.vwf"
#      - if nil, applications.create "path/to/application/index.vwf"
#      - if nil, applications.create, and redirect to resulting id
#      - if nil, error
#   - instance creation
#      - instances.create
#      - if nil, error
#   - revision creation
#      - revisions.create "1.234"
#      - if nil, error


# public/
#   a/      contains index.vwf
#   a/b/    contains index.vwf
#   a/b/c/  contains index.vwf
#   a/ri/   reserved name, contains index.vwf
#   a/ri/c/ contains index.vwf
#   a/rx/   reserved name, doesn't contain index.vwf
#   a/rx/c/ contains index.vwf
#   x/      doesn't contain index.vwf
#   x/ri/   reserved name, contains index.vwf
#   x/ri/c/ contains index.vwf
#   x/rx/   reserved name
#   x/rx/c/ doesn't contain index.vwf

# r is a reflector reserved name (instances, instance, revisions, revision, client, reflector, time, ...)

# 
# requests:
#   /a      found a because a is a directory and contains index.vwf
#   /a/b    found a/b because all nodes are directories and last node contains index.vwf; continued past a because b matches
#   /a/b/c  found a/b/c because all nodes are directories and last node contains index.vwf; continued past a and b because c matches
#   /a/ri   found a because a is a directory and contains index.vwf; stopped before ri because a matches and ri is a reserved name
#   /a/ri/c found a because a is a directory and contains index.vwf; stopped before ri because a matches and ri is a reserved name
#   /a/rx   found a because a is a directory and contains index.vwf; stopped before rx because a matches and rx is a reserved name
#   /a/rx/c found a because a is a directory and contains index.vwf; stopped before rx because a matches and rx is a reserved name
#   /x      pass because x does not contain index.vwf
#   /x/ri   found x/ri because all nodes are directories and last node contains index.vwf; continued to ri because names only reserved following directories containing index.vwf
#   /x/ri/c found x/ri/c because all nodes are directories and last node contains index.vwf; continued to ri because names only reserved following directories containing index.vwf and because c matches
#   /x/rx   pass because x and rx do not contain index.vwf; continued to rx because names only reserved following directories containing index.vwf
#   /x/rx/c found x/rx/c because all nodes are directories and last node contains index.vwf; continued to rx because names only reserved following directories containing index.vwf and because c matches

# cracking url:
#   - deepest path that is an application
#   - longest id in application database that matches the url

# Look in registry for longest application resource matching the first part of the url (DatabasePattern?)
# If found, take as script_name and forward to application
# If 404 (because request is not for "", "/", or "/reserved/*"), look against filesystem (Pattern)
# Filesystem script_name and forward

# If 404

# VWF::Application::Storage::Volatile::Applications.new.create( @application ) -- create @application
# VWF::Application::Storage::Volatile::Applications.new[ @application ] -- @application exists?

# VWF::Application::Storage::Volatile::Applications.new[ @application ].instances[ @instance ] -- `@instance` exists?
# VWF::Application::Storage::Volatile::Applications.new[ @application ].instances.create -- create and assign id
# VWF::Application::Storage::Volatile::Applications.new[ @application ].instances[] | ... -- list of instances with id and properties
# VWF::Application::Storage::Volatile::Applications.new[ @application ].instances[ @instance ].get -- properties of `@instance`
# VWF::Application::Storage::Volatile::Applications.new[ @application ].instances.get( @instance ) -- properties of `@instance`








class VWF < Sinatra::Base

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

  class Item

    attr_reader :collection  # , :id
attr_accessor :id  # TODO: for testing

    def initialize collection, id, value = nil
      @collection = collection
      @id = id
      set value if value
    end

    def get ; end  # => value             # GET /instances/:instance
    def set value ; end                   # PUT /instances/:instance

  end

  module Storage

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
      def create id, value
        super.tap do |revision|
          if ! revision.id && revision.get  # TODO: don't do a database read for value since we just had it
            revision.id = revision.get["kernel"]["time"].to_s
          end
        end
      end
      def type ; self.Revision ; end
      def current ; end
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

      def get
        if revision = revisions.current  # TODO: most recent revision (better: current captive state or from client)
          revision.get
        end
      end

      def set value
        revisions.create value

          # @storage.queue.flush to revision  TODO

      end

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

      def current  # TODO: base class
        if key = @revisions.keys[-1]
          @revisions[key]
        end
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


















# class VWF::xxx

#   class Applications

#     def initialize
#       @records = []
#       @loaded = false
#     end

#     def [] id
#       to_a.find { |record| record.id == id }
#     end

#     def to_a
#       load
#       @records
#     end

#     def inspect
#       entries = to_a.map &:inspect
#       "#<#{self.class.name} [#{entries.join(', ')}]>"
#     end

#     def load
#       unless @loaded
#         @records = [ Application.new( id ), Application.new( id ) ]
#         @loaded = true
#       end
#     end

#   end

#   Application = Struct.new :id do

#     def instances
#       @instances ||= Instances.new self
#     end

#   end

#   class Instances

#     def initialize application
#       @application = application
#       @records = []
#       @loaded = false
#     end

#     def [] id
#       to_a.find { |record| record.id == id }
#     end

#     def to_a
#       load
#       @records
#     end

#     def inspect
#       entries = to_a.map &:inspect
#       "#<#{self.class.name} [#{entries.join(', ')}]>"
#     end

#     def load
#       unless @loaded
#         @records = [ Instance.new( id ), Instance.new( id ) ]
#         @loaded = true
#       end
#     end

#   end

#   class Instance

#     def initialize id, application
#     end

#     def revisions
#     end

#     def []( revision_id )
#     end

#   end

#   class Revision

#     def initialize id, instance
#     end

#   end

# end

