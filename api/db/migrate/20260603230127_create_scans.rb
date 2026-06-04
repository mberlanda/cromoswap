class CreateScans < ActiveRecord::Migration[8.1]
  def change
    create_table :scans, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :session, type: :uuid, null: false, foreign_key: true
      t.string :normalized_code, null: false
      t.string :source, null: false, default: "ocr"
      t.float :confidence
      t.datetime :captured_at, null: false
      t.timestamps
    end
    add_index :scans, :normalized_code
  end
end
