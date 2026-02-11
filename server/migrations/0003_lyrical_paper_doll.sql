CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"subscribed_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "background_color" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "background_color" SET DEFAULT 'rgba(255,255,255,0.1)';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "border_color" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "border_color" SET DEFAULT 'rgba(255,255,255,0.2)';