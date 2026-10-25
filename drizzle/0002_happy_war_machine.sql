CREATE TABLE "alert_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(50) NOT NULL,
	"key_masked" varchar(100),
	"role" varchar(50) DEFAULT 'PRO' NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key_id" integer,
	"endpoint" text NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"ip_address" varchar(45),
	"latency_ms" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dkp_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_email" varchar(255) NOT NULL,
	"title" varchar(120) NOT NULL,
	"snippet" varchar(255),
	"target_url" text NOT NULL,
	"category_tag" varchar(50) DEFAULT 'SPONSORIZZATO DKP',
	"budget_credits" integer DEFAULT 100 NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"impressions_count" integer DEFAULT 0,
	"clicks_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dkp_crawler_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"license_key" varchar(255) NOT NULL,
	"tier" varchar(50) DEFAULT 'basic',
	"requests_limit" integer DEFAULT 1000,
	"requests_used" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "dkp_crawler_licenses_license_key_unique" UNIQUE("license_key")
);
--> statement-breakpoint
CREATE TABLE "ip_blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"reason" text NOT NULL,
	"severity" text NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ip_blacklist_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "ip_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(45) NOT NULL,
	"description" text NOT NULL,
	"added_by" varchar(100) DEFAULT 'Admin',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ip_whitelist_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "pulse_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"tx_type" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_badge" varchar(50) DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name_color" varchar(20) DEFAULT '#f8fafc' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dkp_crawler_licenses" ADD CONSTRAINT "dkp_crawler_licenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_transactions" ADD CONSTRAINT "pulse_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;