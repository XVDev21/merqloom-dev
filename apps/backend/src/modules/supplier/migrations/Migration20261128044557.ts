import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261128044557 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier" drop constraint if exists "supplier_code_unique";`);
    this.addSql(`create table if not exists "supplier" ("id" text not null, "code" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_code_unique" ON "supplier" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_mapping" ("id" text not null, "external_sku" text not null, "supplier_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_mapping_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_mapping_supplier_id" ON "supplier_mapping" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_mapping_deleted_at" ON "supplier_mapping" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_mapping_supplier_sku" ON "supplier_mapping" ("supplier_id", "external_sku");`);

    this.addSql(`alter table if exists "supplier_mapping" add constraint "supplier_mapping_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_mapping" drop constraint if exists "supplier_mapping_supplier_id_foreign";`);

    this.addSql(`drop table if exists "supplier" cascade;`);

    this.addSql(`drop table if exists "supplier_mapping" cascade;`);
  }

}
