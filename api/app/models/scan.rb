class Scan < ApplicationRecord
  SOURCES = %w[ocr manual].freeze

  belongs_to :session

  validates :normalized_code, format: { with: /\A[A-Z]{3}\d{2}\z/ }
  validates :source, inclusion: { in: SOURCES }
  validates :captured_at, presence: true
end
