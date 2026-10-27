CREATE TABLE "app_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_downloads_app_position_key" UNIQUE("app_id","position"),
	CONSTRAINT "app_downloads_position_range" CHECK ("app_downloads"."position" >= 0 AND "app_downloads"."position" < 3),
	CONSTRAINT "app_downloads_label_length" CHECK (char_length(btrim("app_downloads"."label")) BETWEEN 1 AND 40),
	CONSTRAINT "app_downloads_url_format" CHECK ("app_downloads"."url" ~ '^https://[^[:space:]]+$' AND char_length("app_downloads"."url") <= 2048)
);
--> statement-breakpoint
ALTER TABLE "app_downloads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_recommendations" (
	"app_id" uuid NOT NULL,
	"recommended_app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_recommendations_pkey" PRIMARY KEY("app_id","position"),
	CONSTRAINT "app_recommendations_pair_key" UNIQUE("app_id","recommended_app_id"),
	CONSTRAINT "app_recommendations_position_range" CHECK ("app_recommendations"."position" >= 0 AND "app_recommendations"."position" < 3),
	CONSTRAINT "app_recommendations_not_self" CHECK ("app_recommendations"."app_id" <> "app_recommendations"."recommended_app_id")
);
--> statement-breakpoint
ALTER TABLE "app_recommendations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"path" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_screenshots_app_position_key" UNIQUE("app_id","position"),
	CONSTRAINT "app_screenshots_position_range" CHECK ("app_screenshots"."position" >= 0 AND "app_screenshots"."position" < 8),
	CONSTRAINT "app_screenshots_path_length" CHECK (char_length("app_screenshots"."path") BETWEEN 1 AND 300),
	CONSTRAINT "app_screenshots_dimensions" CHECK ("app_screenshots"."width" BETWEEN 1 AND 10000 AND "app_screenshots"."height" BETWEEN 1 AND 10000)
);
--> statement-breakpoint
ALTER TABLE "app_screenshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_path" text,
	"size_label" text,
	"version" text,
	"description_id" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_slug_key" UNIQUE("slug"),
	CONSTRAINT "apps_slug_format" CHECK ("apps"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("apps"."slug") <= 80),
	CONSTRAINT "apps_name_length" CHECK (char_length(btrim("apps"."name")) BETWEEN 1 AND 80),
	CONSTRAINT "apps_logo_path_length" CHECK ("apps"."logo_path" IS NULL OR char_length("apps"."logo_path") <= 300),
	CONSTRAINT "apps_size_label_length" CHECK ("apps"."size_label" IS NULL OR char_length(btrim("apps"."size_label")) BETWEEN 1 AND 20),
	CONSTRAINT "apps_version_length" CHECK ("apps"."version" IS NULL OR char_length(btrim("apps"."version")) BETWEEN 1 AND 30),
	CONSTRAINT "apps_description_length" CHECK (char_length("apps"."description_id") <= 5000 AND char_length("apps"."description_en") <= 5000),
	CONSTRAINT "apps_status_valid" CHECK ("apps"."status" IN ('draft', 'published')),
	CONSTRAINT "apps_published_complete" CHECK ("apps"."status" = 'draft' OR (
        "apps"."logo_path" IS NOT NULL
        AND "apps"."size_label" IS NOT NULL
        AND "apps"."version" IS NOT NULL
        AND btrim("apps"."description_id") <> ''
        AND btrim("apps"."description_en") <> ''
        AND "apps"."published_at" IS NOT NULL
      )),
	CONSTRAINT "apps_featured_requires_published" CHECK (NOT "apps"."is_featured" OR "apps"."status" = 'published')
);
--> statement-breakpoint
ALTER TABLE "apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"slug" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"title_en" text NOT NULL,
	"body_id" text NOT NULL,
	"body_en" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_pages_slug_valid" CHECK ("legal_pages"."slug" IN ('terms', 'privacy', 'disclaimer')),
	CONSTRAINT "legal_pages_title_length" CHECK (char_length(btrim("legal_pages"."title_id")) BETWEEN 1 AND 120 AND char_length(btrim("legal_pages"."title_en")) BETWEEN 1 AND 120),
	CONSTRAINT "legal_pages_body_length" CHECK (char_length(btrim("legal_pages"."body_id")) BETWEEN 1 AND 100000 AND char_length(btrim("legal_pages"."body_en")) BETWEEN 1 AND 100000)
);
--> statement-breakpoint
ALTER TABLE "legal_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_downloads" ADD CONSTRAINT "app_downloads_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_recommendations" ADD CONSTRAINT "app_recommendations_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_recommendations" ADD CONSTRAINT "app_recommendations_recommended_app_id_apps_id_fk" FOREIGN KEY ("recommended_app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_screenshots" ADD CONSTRAINT "app_screenshots_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_recommendations_recommended_idx" ON "app_recommendations" USING btree ("recommended_app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_single_featured_idx" ON "apps" USING btree ("is_featured") WHERE "apps"."is_featured";--> statement-breakpoint
CREATE INDEX "apps_published_at_idx" ON "apps" USING btree ("published_at" DESC NULLS LAST) WHERE "apps"."status" = 'published';