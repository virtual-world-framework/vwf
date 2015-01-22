require "vwf/storageneueneue"
require_relative "couch_db/collection"

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
    end

    class Revision < Storage::Revision
      include Types
      include Item
      def template ; self.class.template.merge "instance" => collection.container.dbid ; end
      def self.template ; { "type" => "revision" } ; end
    end

    class States < Storage::States
      include Enumerable
      include Types
      include Collection
    end

    class State < Storage::State
      include Types
      include Item
      def template ; self.class.template.merge "instance" => collection.container.dbid ; end
      def self.template ; { "type" => "state" } ; end
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
