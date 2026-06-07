class User < ApplicationRecord
  USERNAME_FORMAT = /\A[a-z0-9]+\z/

  has_secure_password
  has_one :session, dependent: :nullify

  before_validation { username&.downcase! }

  validates :username,
            presence: true,
            format: { with: USERNAME_FORMAT },
            length: { in: 3..30 },
            uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, allow_nil: true
end
