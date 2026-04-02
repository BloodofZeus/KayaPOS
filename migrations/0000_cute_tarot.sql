CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "synced_business_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"logo" text,
	"business_type" text DEFAULT 'retail' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "synced_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "synced_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"tax_rule_name" text,
	"tax_rate" numeric(5, 4),
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_type" text,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"payment_methods" jsonb NOT NULL,
	"customer_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "synced_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"barcode" text,
	"sku" text,
	"image" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"dosage_form" text,
	"strength" text,
	"requires_prescription" boolean DEFAULT false,
	"manufacturer" text,
	"service_time" integer,
	"serving_size" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
