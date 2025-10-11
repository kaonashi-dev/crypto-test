CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"contract_address" text,
	"token_standard" varchar(20),
	"is_native" boolean DEFAULT false NOT NULL,
	"is_stablecoin" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_transaction_amount" numeric(30, 18) DEFAULT '0' NOT NULL,
	"max_transaction_amount" numeric(30, 18),
	"logo_url" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency_id" integer NOT NULL,
	"base_currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"source" varchar(50) NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"chain_id" integer,
	"rpc_url" text,
	"explorer_url" text,
	"is_testnet" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_confirmations" integer DEFAULT 1 NOT NULL,
	"avg_block_time_seconds" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "networks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_network_id_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;