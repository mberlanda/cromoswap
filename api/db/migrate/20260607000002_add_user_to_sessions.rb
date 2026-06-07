class AddUserToSessions < ActiveRecord::Migration[8.1]
  def change
    # Nullable so existing sessions backfill gradually and local-origin data can
    # land before being claimed; unique enforces the 1:1 user <-> session rule.
    add_reference :sessions, :user, type: :uuid, null: true, foreign_key: true, index: { unique: true }
  end
end
