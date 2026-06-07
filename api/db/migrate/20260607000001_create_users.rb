class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :username, null: false
      t.string :password_digest, null: false
      t.timestamps
    end

    # Case-insensitive uniqueness without enabling citext: a functional unique
    # index on lower(username). The model downcases username before validation,
    # so the index and the app-level validation agree.
    add_index :users, "lower(username)", unique: true, name: "index_users_on_lower_username"
  end
end
