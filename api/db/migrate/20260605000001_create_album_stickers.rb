class CreateAlbumStickers < ActiveRecord::Migration[8.1]
  def change
    create_table :album_stickers, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :user_name, null: false
      t.string :normalized_code, null: false
      t.datetime :owned_at, null: false
      t.timestamps
    end

    add_index :album_stickers, :user_name
    add_index :album_stickers, [:user_name, :normalized_code], unique: true
  end
end
