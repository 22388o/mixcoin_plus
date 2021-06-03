# frozen_string_literal: true

# == Schema Information
#
# Table name: arbitrage_orders
#
#  id              :uuid             not null, primary key
#  net_profit      :decimal(, )
#  raw             :json
#  state           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  arbitrager_id   :uuid
#  market_id       :uuid
#  profit_asset_id :string
#
# Indexes
#
#  index_arbitrage_orders_on_arbitrager_id  (arbitrager_id)
#  index_arbitrage_orders_on_market_id      (market_id)
#
class ArbitrageOrder < ApplicationRecord
  REASONABLE_EXPECTED_PROFIT_RATIO = 0.1
  TIMEOUT_SECONDS = 60

  extend Enumerize
  include AASM

  store :raw, accessors: %i[expected_profit]

  belongs_to :market
  belongs_to :arbitrager, primary_key: :mixin_uuid, optional: true
  belongs_to :profit_asset, class_name: 'MixinAsset', primary_key: :asset_id

  has_many :ocean_orders, dependent: :restrict_with_exception
  has_many :swap_orders, dependent: :restrict_with_exception

  before_validation :set_defaults, on: :create

  validates :profit_asset_id, presence: true
  validates :raw, presence: true

  after_commit on: :create do
    if arbitrager_balance_sufficient? && expected_profit_reasonable?
      arbitrage!
    else
      notify_admin_async
    end
  end

  scope :without_drafted, -> { where.not(state: :drafted) }
  scope :only_timeout, -> { arbitraging.where(created_at: ...(Time.current - TIMEOUT_SECONDS.seconds)) }

  aasm column: :state do
    state :drafted, initial: true
    state :arbitraging
    state :completed
    state :canceled

    event :arbitrage, guards: %i[arbitrager_balance_sufficient?], after: %i[generate_ocean_order notify_admin_async] do
      transitions from: :drafted, to: :arbitraging
    end

    event :cancel, after: %i[calculate_net_profit notify_admin_async] do
      transitions from: :arbitraging, to: :canceled
    end

    event :complete, guards: :ensure_ocean_and_swap_orders_finished, after: %i[calculate_net_profit notify_admin_async] do
      transitions from: :arbitraging, to: :completed
    end
  end

  def calculate_net_profit
    profit =
      case raw[:ocean][:side]
      when :bid
        swap_orders.sum(:fill_amount) - ocean_orders.sum(:filled_funds)
      when :ask
        swap_orders.sum(:fill_amount) - ocean_orders.sum(:filled_amount)
      end

    update net_profit: profit
  end

  def arbitrager_balance_sufficient?
    case raw[:ocean][:side]
    when :bid
      arbitrager_balance >= raw[:ocean][:funds]
    when :ask
      arbitrager_balance >= raw[:ocean][:amount]
    end
  end

  def expected_profit_reasonable?
    case raw[:ocean][:side]
    when :bid
      expected_profit / raw[:ocean][:funds] < REASONABLE_EXPECTED_PROFIT_RATIO
    when :ask
      expected_profit / raw[:ocean][:amount] < REASONABLE_EXPECTED_PROFIT_RATIO
    end
  end

  def arbitrager_balance
    return 0 if arbitrager.blank?

    arbitrager.mixin_api.asset(profit_asset_id)['data']['balance'].to_f
  end

  def generate_ocean_order
    ocean_orders.create(
      broker: arbitrager,
      market: market,
      side: raw[:ocean][:side],
      order_type: :limit,
      price: raw[:ocean][:price],
      remaining_amount: raw[:ocean][:amount],
      remaining_funds: raw[:ocean][:funds]
    )
  end

  def timeout?
    arbitraging? && (Time.current - created_at - TIMEOUT_SECONDS.seconds).positive?
  end

  def timeout!
    return unless arbitraging?

    ocean_orders.booking.where(created_at: ...(Time.current - TIMEOUT_SECONDS.seconds)).map(&:cancel!)
  end

  def notify_admin_async
    SendMixinMessageWorker.perform_async MixcoinPlusBot.api.plain_text(
      conversation_id: MixcoinPlusBot.api.unique_uuid(Rails.application.credentials.fetch(:admin_mixin_uuid)),
      data: "#{market.base_asset.symbol}/#{market.quote_asset.symbol} order #{state}, profit:#{net_profit || '-'}/#{raw['expected_profit']} #{profit_asset.symbol}"
    )
  end

  private

  def ensure_ocean_and_swap_orders_finished
    ocean_orders.without_finished.blank? && swap_orders.without_finished.blank?
  end

  def set_defaults
    assign_attributes(
      profit_asset_id: raw['profit_asset_id']
    )
  end
end
