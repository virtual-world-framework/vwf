require "vwf/storageneueneue"
require_relative "couch_db/collection"

class VWF

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
                  emit( [ doc.application, doc.type, localid( doc ) ], doc ); break;
                case "revision":
                  emit( [ doc.instance, doc.type, +localid( doc ) ], doc ); break;
                case "state":
                  emit( [ doc.instance, doc.type, +localid( doc ) ], doc ); break;
                case "action":
                  emit( [ doc.instance, doc.type, +localid( doc ) ], doc ); break;
                case "tag":
                  emit( [ doc.application || doc.instance || doc.revision, doc.type, localid( doc ) ], doc ); break;
              }
              function localid( doc ) {
                return doc._id.replace( RegExp( "^.*/" + doc.type + "/" ), "" )
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

    class Tags < Storage::Tags
      include Types
      include Collection
    end

    class Tag < Storage::Tag
      include Types
      include Item
    end

  end

end
