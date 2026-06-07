class Session < ApplicationRecord
  belongs_to :user, optional: true
  has_many :scans, dependent: :destroy

  validates :user_name, presence: true
end
