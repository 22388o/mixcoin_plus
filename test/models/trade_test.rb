# frozen_string_literal: true

# == Schema Information
#
# Table name: trades
#
#  id             :uuid             not null, primary key
#  amount         :decimal(, )
#  price          :decimal(, )
#  raw            :json             not null
#  side           :string
#  traded_at      :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  base_asset_id  :uuid             not null
#  market_id      :uuid             not null
#  quote_asset_id :uuid             not null
#  trade_id       :uuid             not null
#
# Indexes
#
#  index_trades_on_base_asset_id   (base_asset_id)
#  index_trades_on_market_id       (market_id)
#  index_trades_on_quote_asset_id  (quote_asset_id)
#  index_trades_on_trade_id        (trade_id) UNIQUE
#
require 'test_helper'

class TradeTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
