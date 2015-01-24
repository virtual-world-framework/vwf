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

    def self.unindent heredoc
      heredoc.gsub /^#{ heredoc.match /^\s*/ }/, ""
    end

    DESIGN_DOCUMENT_ID = "_design/collection"

    DESIGN_DOCUMENT_VALUE = {
      "language" => "javascript",
      "views" => {
        "members" => {
          "map" => unindent( <<-EOF ),
            function( doc ) {
              switch( doc.type ) {
                case "application":
                  emit( [ "", doc.type, doc._id ], doc ); break;
                case "instance":
                  emit( [ doc.application, doc.type, doc._id ], doc ); break;
                case "revision":
                  emit( [ doc.instance, doc.type, doc.value.queue.time ], doc ); break;
                case "action":
                  emit( [ doc.instance, doc.type, doc.value.sequence ], doc ); break;
                case "tag":
                  emit( [ doc.instance, doc.type, doc._id ], doc ); break;
              }
            }
          EOF
          "reduce" => "_count"
        }
      }
    }

    module Types

      def Applications ; Applications ; end
      def Application ; Application ; end
      def Instances ; Instances ; end
      def Instance ; Instance ; end
      def Revisions ; Revisions ; end
      def Revision ; Revision ; end
      def States ; States ; end
      def State ; State ; end
      def Actions ; Actions ; end
      def Action ; Action ; end
      def Tags ; Tags ; end
      def Tag ; Tag ; end

      def db
        @@db ||= CouchRest.database!( "http://127.0.0.1:5984/vwf" ).tap do |db|  # TODO: configuration option for url
          create_design_documents db
        end
      end

    private

      def create_design_documents db
        begin
          db.get DESIGN_DOCUMENT_ID
        rescue RestClient::ResourceNotFound
          db.save_doc DESIGN_DOCUMENT_VALUE.merge "_id" => DESIGN_DOCUMENT_ID
        end
      end

    end

    class Applications < Storage::Applications
      include Types
      include Collection
    end

    class Application < Storage::Application
      include Types
      include Item
    end

    class Instances < Storage::Instances
      include Types
      include Collection
    end

    class Instance < Storage::Instance
      include Types
      include Item
    end

    class Revisions < Storage::Revisions
      include Types
      include Collection
    end

    class Revision < Storage::Revision
      include Types
      include Item
    end

    class States < Storage::States
      include Types
      include Collection
    end

    class State < Storage::State
      include Types
      include Item
    end

    class Actions < Storage::Actions
      include Types
      include Collection
    end

    class Action < Storage::Action
      include Types
      include Item
    end

  end

end
