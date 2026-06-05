class AlbumSticker < ApplicationRecord
  VALID_CODE = /\A[A-Z]{3}\d{2}\z/

  validates :user_name, presence: true
  validates :normalized_code, presence: true, format: { with: VALID_CODE }
  validates :owned_at, presence: true
  validates :normalized_code, uniqueness: { scope: :user_name }
end
