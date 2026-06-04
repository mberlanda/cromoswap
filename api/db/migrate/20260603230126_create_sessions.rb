class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :user_name, null: false
      t.timestamps
    end
  end
end
