CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"discord_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text,
	"plan_id" text NOT NULL,
	"plan_name" text NOT NULL,
	"tokens" text NOT NULL,
	"amount_idr" integer NOT NULL,
	"final_amount_idr" integer,
	"email" text NOT NULL,
	"discord_id" text,
	"whatsapp" text,
	"telegram" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_url" text,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"discord_notified" boolean DEFAULT false NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"fulfillment_note" text,
	"fulfilled_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"invoice_id" text,
	"source" text NOT NULL,
	"raw_body" jsonb NOT NULL,
	"check_result" jsonb,
	"processed_ok" boolean DEFAULT false NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_uidx" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_invoice_id_uidx" ON "orders" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "orders_status_expires_idx" ON "orders" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_fulfilled_idx" ON "orders" USING btree ("status","fulfilled_at");--> statement-breakpoint
CREATE INDEX "payment_events_order_created_idx" ON "payment_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_events_invoice_idx" ON "payment_events" USING btree ("invoice_id");