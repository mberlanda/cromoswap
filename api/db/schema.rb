# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_05_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "album_stickers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "normalized_code", null: false
    t.datetime "owned_at", null: false
    t.datetime "updated_at", null: false
    t.string "user_name", null: false
    t.index ["user_name", "normalized_code"], name: "index_album_stickers_on_user_name_and_normalized_code", unique: true
    t.index ["user_name"], name: "index_album_stickers_on_user_name"
  end

  create_table "scans", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "captured_at", null: false
    t.float "confidence"
    t.datetime "created_at", null: false
    t.string "normalized_code", null: false
    t.uuid "session_id", null: false
    t.string "source", default: "ocr", null: false
    t.datetime "updated_at", null: false
    t.index ["normalized_code"], name: "index_scans_on_normalized_code"
    t.index ["session_id"], name: "index_scans_on_session_id"
  end

  create_table "sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "user_name", null: false
  end

  add_foreign_key "scans", "sessions"
end
