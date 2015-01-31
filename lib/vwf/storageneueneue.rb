require_relative "storage/collection"
require "securerandom"

module VWF::Storage

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
  end

  class Applications < Collection
    include Types
    def type ; self.Application ; end
  end

  class Application < Item

    include Types

    def instances ; @instances ||= self.Instances.new self ; end
    def tags ; @tags ||= self.Tags.new self ; end

    def state
      Hash[
        "configuration" =>
          { "environment" => ENV["RACK_ENV"] || "development",  # TODO: ENV['RACK_ENV'], ugh
              "random-seed" => SecureRandom.hex },
        "kernel" =>
          { "time" => 0 },
        "nodes" =>
          [ "http://vwf.example.com/clients.vwf", get ],
        "annotations" =>
          { "1" => "application" },
        "queue" =>
          { "time" => 0 }
      ]
    end

  end

  class Instances < Collection
    include Types
    def type ; self.Instance ; end
  end

  class Instance < Item

    include Types

    def initialize collection, id = nil, value = nil
      super collection, id, value && {}
      states.create 0.to_s, value if value && value != {}  # TODO: `value != {}` is a hack to avoid recreating the state when load an instance from storage; state creation should be based on Instance#set, but overrides aren't set up for that
    end

    def revisions ; @revisions ||= self.Revisions.new self ; end
    def states ; @states ||= self.States.new self ; end
    def actions ; @actions ||= self.Actions.new self ; end
    def tags ; @tags ||= self.Tags.new self ; end

    def state sequence_id = nil

      result = nil

      states.reverse_each( nil, sequence_id ) do |state_id, state|

        result = state.get

        result[ "kernel" ] ||= {}
        result[ "queue" ] ||= {}

        queue = result[ "queue" ][ "queue" ] ||= []

        action_queue = actions.each( state_id, sequence_id ).map do |action_id, action|
          if action_id == state_id
            next
          else
            action.get.merge "origin" => "reflector"
          end
        end .compact

        unless action_queue.empty?
          result[ "queue" ][ "time" ] =
            [ result[ "queue" ][ "time" ] || 0, action_queue.last[ "time" ] || 0 ].max
        end

        queue.concat action_queue

        queue.each_with_index do |action, index|
          action[ "sequence" ] = index
        end

        queue.sort! do |a, b|
          if a[ "time" ] != b[ "time" ]
            a[ "time" ] - b[ "time" ]
          elsif a[ "origin" ] != "reflector" && b[ "origin" ] == "reflector"
            -1
          elsif a[ "origin" ] == "reflector" && b[ "origin" ] != "reflector"
            1
          else
            a[ "sequence" ] - b[ "sequence" ]
          end
        end

        queue.each do |action|
          action.delete "sequence"
        end

        break

      end

      result

    end

  end

  class Revisions < Collection
    include Types
    def type ; self.Revision ; end
    def sortid id ; id.to_i ; end
  end

  class Revision < Item

    include Types

    def tags ; @tags ||= self.Tags.new self ; end

    def state
      if collection.container
        collection.container.state id
      end
    end

  end

  class States < Collection

    include Types
    def type ; self.State ; end
    def sortid id ; id.to_i ; end

    def create id, value

      # Purge actions leading to this state.  TODO: retainment policy options: keep if associated with a revision, keep certain intervals, ...

      if container && container.respond_to?( :actions )
        container.actions.reverse_each.select do |_, action|
          action.id.to_i <= id.to_i  # TODO: revision, state, action id === Integer?
        end .each do |_, action|
          container.actions.delete action.id
        end
      end

      # Purge earlier states.  TODO: retainment policy options: keep if associated with a revision, keep certain intervals, ...

      reverse_each.select do |_, state|
        state.id.to_i < id.to_i  # TODO: revision, state, action id === Integer?
      end .each do |_, state|
        delete state.id
      end

      super

    end

  end

  class State < Item
    include Types
  end

  class Actions < Collection
    include Types
    def type ; self.Action ; end
    def sortid id ; id.to_i ; end
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
