CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tokens" text NOT NULL,
	"base_price_idr" integer NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"description" text,
	"duration" text NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_limited" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "plans_active_sort_idx" ON "plans" USING btree ("is_active","sort_order");