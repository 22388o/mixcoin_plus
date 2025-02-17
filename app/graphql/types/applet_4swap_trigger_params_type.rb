# frozen_string_literal: true

module Types
  class Applet4swapTriggerParamsType < Types::AppletTriggerType
    field :description, String, null: false
    field :base_asset_id, String, null: false
    field :quote_asset_id, String, null: false
    field :target_value, Float, null: true
    field :target_index, String, null: false
    field :compare_action, String, null: false
  end
end
