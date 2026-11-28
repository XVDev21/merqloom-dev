import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261128072942 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "supplier_import_run" ("id" text not null, "supplier_id" text not null, "idempotency_key" text not null, "payload_hash" text not null, "status" text check ("status" in ('running', 'succeeded', 'rejected', 'failed', 'reconciliation')) not null default 'running', "row_count" integer not null default 0, "applied_count" integer not null default 0, "error_code" text null, "error_row" integer null, "targets" jsonb not null default '[]', "plan" jsonb not null default '[]', "completed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_import_run_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_import_run_supplier_id" ON "supplier_import_run" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_import_run_deleted_at" ON "supplier_import_run" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_import_run_key" ON "supplier_import_run" ("supplier_id", "idempotency_key");`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_import_run_active" ON "supplier_import_run" ("supplier_id") WHERE status IN ('running', 'reconciliation') AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_observation" ("id" text not null, "mapping_id" text not null, "run_id" text not null, "quantity" integer not null, "observed_at" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_observation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_observation_mapping_id" ON "supplier_observation" ("mapping_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_observation_run_id" ON "supplier_observation" ("run_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_observation_deleted_at" ON "supplier_observation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_observation_run_mapping" ON "supplier_observation" ("run_id", "mapping_id");`);

    this.addSql(`alter table if exists "supplier_import_run" add constraint "supplier_import_run_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);

    this.addSql(`alter table if exists "supplier_observation" add constraint "supplier_observation_mapping_id_foreign" foreign key ("mapping_id") references "supplier_mapping" ("id") on update cascade;`);
    this.addSql(`alter table if exists "supplier_observation" add constraint "supplier_observation_run_id_foreign" foreign key ("run_id") references "supplier_import_run" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_observation" drop constraint if exists "supplier_observation_run_id_foreign";`);

    this.addSql(`drop table if exists "supplier_import_run" cascade;`);

    this.addSql(`drop table if exists "supplier_observation" cascade;`);
  }

}
