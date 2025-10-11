ALTER TABLE "transactions" ALTER COLUMN "wallet_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "network" varchar(20);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "coin" varchar(20);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "reference" varchar(255);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant_id" varchar(255);