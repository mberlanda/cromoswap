class Session < ApplicationRecord
  has_many :scans, dependent: :destroy

  validates :user_name, presence: true
end
