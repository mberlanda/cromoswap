require "open3"

module Admin
  class ExportsController < BaseController
    # GET /admin/export.json — full data dump as JSON.
    def json
      data = {
        exportedAt: Time.current.iso8601,
        sessions: Session.includes(:scans).order(:created_at).map { |s| session_export(s) },
        albumStickers: AlbumSticker.order(:user_name, :normalized_code).map { |a| sticker_export(a) }
      }
      send_data JSON.pretty_generate(data),
        filename: "cromoswap-#{Date.current}.json", type: "application/json"
    end

    # GET /admin/export.sql — full Postgres dump via pg_dump.
    def sql
      unless pg_dump_available?
        return render plain: "pg_dump is not available in this environment.", status: :service_unavailable
      end
      send_data generate_pg_dump,
        filename: "cromoswap-#{Date.current}.sql", type: "application/sql"
    rescue StandardError => e
      render plain: "Export failed: #{e.message}", status: :internal_server_error
    end

    private

    def session_export(session)
      {
        id: session.id,
        userName: session.user_name,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        scans: session.scans.map do |scan|
          {
            id: scan.id,
            normalizedCode: scan.normalized_code,
            source: scan.source,
            confidence: scan.confidence,
            capturedAt: scan.captured_at
          }
        end
      }
    end

    def sticker_export(sticker)
      {
        id: sticker.id,
        userName: sticker.user_name,
        normalizedCode: sticker.normalized_code,
        ownedAt: sticker.owned_at
      }
    end

    def pg_dump_available?
      system("command -v pg_dump > /dev/null 2>&1")
    end

    def generate_pg_dump
      config = ActiveRecord::Base.connection_db_config.configuration_hash
      env = { "PGPASSWORD" => config[:password].to_s }
      args = [ "-h", config[:host].to_s, "-p", config[:port].to_s,
              "-U", config[:username].to_s, config[:database].to_s ]
      out, err, status = Open3.capture3(env, "pg_dump", *args)
      raise "pg_dump failed: #{err}" unless status.success?
      out
    end
  end
end
