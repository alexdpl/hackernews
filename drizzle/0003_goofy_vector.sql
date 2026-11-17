CREATE TABLE "node_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"karma_score" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"karma_score" integer DEFAULT 1 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"vault_hash" varchar(64),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer,
	"comment_id" integer,
	"vote_value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_node_post_vote" UNIQUE("user_id","post_id"),
	CONSTRAINT "unique_node_comment_vote" UNIQUE("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) DEFAULT 'i-heroicons-hashtag',
	"color" varchar(30) DEFAULT '#38bdf8',
	"creator_id" integer NOT NULL,
	"subscribers_count" integer DEFAULT 0 NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nodes_name_unique" UNIQUE("name"),
	CONSTRAINT "nodes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "pulse_stories" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "node_comments" ADD CONSTRAINT "node_comments_post_id_node_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."node_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_comments" ADD CONSTRAINT "node_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_posts" ADD CONSTRAINT "node_posts_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_posts" ADD CONSTRAINT "node_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_votes" ADD CONSTRAINT "node_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_votes" ADD CONSTRAINT "node_votes_post_id_node_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."node_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_votes" ADD CONSTRAINT "node_votes_comment_id_node_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."node_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;