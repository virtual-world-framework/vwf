require "vwf/storage"

class VWF


  # @@db ||= CouchRest.database!( "http://127.0.0.1:5984/vwf" )

  # @@db


  # # create
  # response = @db.save_doc({:key => 'value', 'another key' => 'another value'})                    # => {"ok"=>true, "id"=>"e0d70033da0fad3707fed320bd5e5de2", "rev"=>"1-cbb61d1f90f7c01b273737702265b6c8"}

  # # fetch by id
  # doc = @db.get(response['id'])                                                                   # => #<CouchRest::Document _id: "e0d70033da0fad3707fed320bd5e5de2", _rev: "1-cbb61d1f90f7c01b273737702265b6c8", key: "value", another key: "another value">

  # # update
  # doc["boogie"] = true ; @db.save_doc(doc)                                                        # => {"ok"=>true, "id"=>"e0d70033da0fad3707fed320bd5e5de2", "rev"=>"2-3b067cc9f01fdf25814445088403382c"}

  # doc["_rev"]                                                                                     # => "2-3b067cc9f01fdf25814445088403382c" <- notice it modified the doc _rev


      # #delete_doc(doc, bulk = false) ⇒ Object
      # DELETE the document from CouchDB that has the given _id and _rev.

      # #all_docs(params = {}, payload = {}, &block) ⇒ Object (also: #documents)
      # Query the _all_docs view.

      # #get(id, params = {}) ⇒ Object
      # GET a document from CouchDB, by id.

      # #save_doc(doc, bulk = false, batch = false) ⇒ Object
      # Save a document to CouchDB.





  module Storage::CouchDB

    module Types

      @@db = CouchRest.database!( "http://127.0.0.1:5984/vwf" )  # TODO: configuration option

      def Applications ; Applications ; end
      def Application ; Application ; end
      def Instances ; Instances ; end
      def Instance ; Instance ; end
      def Revisions ; Revisions ; end
      def Revision ; Revision ; end
      def Actions ; Actions ; end
      def Action ; Action ; end

      def db ; @@db ; end

    end



    module Collection

      # def create id = rand( 1000 ).to_s, value = nil  # TODO: actual id calculation, test for uniqueness if provided
      def create id = nil, value = nil  # TODO: actual id calculation, test for uniqueness if provided
        super
      end

      def delete id
      end

      def [] id
        begin
          type.new( self, id ).tap do |item|
            item.get  # throws if missing
          end
        rescue
          nil
        end
      end

      def []= id, value
        begin
          type.new( self, id ).tap do |item|
            item.set value  # throws if missing
          end
        rescue
          nil
        end
      end




#   collection members
#     [ container.dbid, type, member-sort ] => member ( app|inst|rev|act|tag )

# TODO: instance sort as id, not dbid






      def each

        startkey = [ container ? container.dbid : "", type.template[ "type" ] ]
        endkey = [ container ? container.dbid : "", type.template[ "type" ], {} ]

        db.view "_design/instance/_view/actions", :startkey => startkey, :endkey => endkey do |row|  # TODO: rename to "_design/collection/_view/members"
          unless row[ "total_rows" ]
# TODO: put name in documents?
id = row[ "id" ]
id[ /^.*\// ] = ""
            yield [ id, type.new( self, id ) ]
          end
        end

      end

    end

    module Item

      def get
        load
        document[ "value" ]
      end

      def set value
        document[ "value" ] = value
        save
        value
      end

      def load
        if dbid  # TODO: else?
          @document = db.get( dbid )  # TODO: note: throws if missing  # TODO: use document= (isn't working)
        end
      end

      def save
        unless dbid
          document.save
          @id = document.id
          document.copy( dbid )
          document.destroy
        else
          document.id = dbid
          document.save
        end
      end

      def document
        @document ||= CouchRest::Document.new.tap { |document|
          document.database = db
          document.merge! template
          # document.merge! self.class.template
        }
      end

      def dbid
        if id
          if collection.container
            collection.container.dbid + "/" + id
          else
            id
          end
        end
      end

      # def id= value
      #   @id = value
      # end

    end

    class Applications < Storage::Applications
      include Enumerable
      include Types
      include Collection
    end

    class Application < Storage::Application
      include Types
      include Item
      def template ; self.class.template ; end
      def self.template ; { "type" => "application" } ; end
    end

    class Instances < Storage::Instances
      include Enumerable
      include Types
      include Collection
    end

    class Instance < Storage::Instance
      include Types
      include Item
      def template ; self.class.template.merge "application" => collection.container.dbid ; end
      def self.template ; { "type" => "instance" } ; end
    end

    class Revisions < Storage::Revisions

      include Enumerable
      include Types
      include Collection

      def current  # TODO: base class
        if key = @revisions.keys[-1]  # TODO
          @revisions[key]
        end
      end

    end

    class Revision < Storage::Revision
      include Types
      include Item
      def template ; self.class.template.merge "instance" => collection.container.dbid ; end
      def self.template ; { "type" => "revision" } ; end
    end

    class Actions < Storage::Actions
      include Enumerable
      include Types
      include Collection
    end

    class Action < Storage::Action
      include Types
      include Item
      def template ; self.class.template.merge "instance" => collection.container.dbid ; end
      def self.template ; { "type" => "action" } ; end
    end

  end

end


        # @value = revisions.last && revisions.last.get  # TODO: instance vs. revisison
        # revisions.create @value  # TODO: instance vs. revisison



    


