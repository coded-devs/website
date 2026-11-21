ALTER TABLE "admin_users"
  ADD COLUMN "first_name" varchar(100) DEFAULT '' NOT NULL,
  ADD COLUMN "last_name" varchar(100) DEFAULT '' NOT NULL;
