import { pgTable, unique, varchar, text, timestamp, serial, integer, foreignKey, index, jsonb, boolean, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const licenseStatus = pgEnum("license_status", ['active', 'suspended', 'revoked', 'expired'])
export const orderStatus = pgEnum("order_status", ['pending', 'completed', 'failed', 'refunded'])
export const paymentProvider = pgEnum("payment_provider", ['stripe', 'paypal'])


export const users = pgTable("users", {
	username: varchar({ length: 50 }).notNull(),
	bio: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash"),
	role: varchar({ length: 20 }).default('user').notNull(),
	avatarUrl: text("avatar_url"),
	reputation: integer().default(100).notNull(),
	githubHandle: varchar("github_handle", { length: 100 }),
	xp: integer().default(0),
	level: integer().default(1),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const jobs = pgTable("jobs", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	company: varchar({ length: 100 }).notNull(),
	location: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	type: varchar({ length: 50 }).default('Remote').notNull(),
	applyUrl: text("apply_url").notNull(),
	userId: integer("user_id").notNull(),
	salary: varchar({ length: 100 }),
	tags: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "jobs_user_id_users_id_fk"
		}),
]);

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
]);

export const pulseStories = pgTable("pulse_stories", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	url: text().notNull(),
	domain: varchar({ length: 255 }),
	type: varchar({ length: 50 }).default('news'),
	author: varchar({ length: 255 }).default('dkp_crawler'),
	points: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	authorId: integer("author_id"),
	commentsCount: integer("comments_count").default(0),
	xpAwarded: integer("xp_awarded").default(0),
}, (table) => [
	index("idx_pulse_stories_title").using("btree", sql`lower(title)`),
	index("idx_pulse_stories_type_created").using("btree", table.type.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_pulse_stories_url").using("btree", sql`lower(url)`),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	url: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	type: varchar({ length: 20 }).default('news').notNull(),
	points: integer().default(1).notNull(),
	content: text(),
	userId: integer("user_id").notNull(),
	commentsCount: integer("comments_count").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}),
]);

export const vaultCerts = pgTable("vault_certs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	toolType: varchar("tool_type", { length: 50 }).notNull(),
	title: text().notNull(),
	hash: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "vault_certs_user_id_users_id_fk"
		}),
]);

export const pulseUpvotes = pgTable("pulse_upvotes", {
	id: serial().primaryKey().notNull(),
	storyId: integer("story_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [pulseStories.id],
			name: "pulse_upvotes_story_id_fkey"
		}).onDelete("cascade"),
	unique("unique_user_story_upvote").on(table.userId, table.storyId),
]);

export const votes = pgTable("votes", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	username: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "votes_post_id_posts_id_fk"
		}).onDelete("cascade"),
	unique("unique_user_post_vote").on(table.username, table.postId),
]);

export const pulseSubscribers = pgTable("pulse_subscribers", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('ACTIVE'),
	source: varchar({ length: 50 }).default('WEB'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("pulse_subscribers_email_key").on(table.email),
]);

export const pulseMailMessages = pgTable("pulse_mail_messages", {
	id: serial().primaryKey().notNull(),
	sender: varchar({ length: 255 }).notNull(),
	recipient: varchar({ length: 255 }).notNull(),
	subject: text().notNull(),
	bodyText: text("body_text"),
	bodyHtml: text("body_html"),
	direction: varchar({ length: 20 }).default('INBOUND'),
	status: varchar({ length: 20 }).default('UNREAD'),
	isStarred: boolean("is_starred").default(false),
	replyToId: integer("reply_to_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const pulseMailLogs = pgTable("pulse_mail_logs", {
	id: serial().primaryKey().notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	messageId: integer("message_id"),
	sender: varchar({ length: 255 }),
	recipient: varchar({ length: 255 }),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [pulseMailMessages.id],
			name: "pulse_mail_logs_message_id_fkey"
		}).onDelete("set null"),
]);

export const pulseMailQueue = pgTable("pulse_mail_queue", {
	id: serial().primaryKey().notNull(),
	sender: varchar({ length: 255 }).notNull(),
	recipient: varchar({ length: 255 }).notNull(),
	subject: text().notNull(),
	bodyHtml: text("body_html").notNull(),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(5),
	status: varchar({ length: 20 }).default('PENDING'),
	lastError: text("last_error"),
	nextRetryAt: timestamp("next_retry_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const pulseChatMessages = pgTable("pulse_chat_messages", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	role: varchar({ length: 20 }).notNull(),
	text: text().notNull(),
	xpEarned: integer("xp_earned").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const pulseUserXp = pgTable("pulse_user_xp", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	xp: integer().default(150),
	level: integer().default(1),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("pulse_user_xp_username_key").on(table.username),
]);

export const pulseComments = pgTable("pulse_comments", {
	id: serial().primaryKey().notNull(),
	storyId: integer("story_id").notNull(),
	userId: integer("user_id").notNull(),
	username: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [pulseStories.id],
			name: "pulse_comments_story_id_fkey"
		}).onDelete("cascade"),
]);

export const dkpCrawlerLicenses = pgTable("dkp_crawler_licenses", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	licenseKey: varchar("license_key", { length: 255 }).notNull(),
	tier: varchar({ length: 50 }).default('basic'),
	requestsLimit: integer("requests_limit").default(1000),
	requestsUsed: integer("requests_used").default(0),
	isActive: boolean("is_active").default(true),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "dkp_crawler_licenses_user_id_fkey"
		}).onDelete("cascade"),
	unique("dkp_crawler_licenses_license_key_key").on(table.licenseKey),
]);

export const dkpCrawlerLogs = pgTable("dkp_crawler_logs", {
	id: serial().primaryKey().notNull(),
	licenseId: integer("license_id"),
	targetUrl: varchar("target_url", { length: 555 }).notNull(),
	itemsScraped: integer("items_scraped").default(0),
	status: varchar({ length: 50 }).default('success'),
	executionTimeMs: integer("execution_time_ms"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.licenseId],
			foreignColumns: [dkpCrawlerLicenses.id],
			name: "dkp_crawler_logs_license_id_fkey"
		}),
]);

export const orders = pgTable("orders", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	productId: varchar("product_id", { length: 100 }).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('EUR').notNull(),
	paymentProvider: paymentProvider("payment_provider").notNull(),
	paymentIntentId: varchar("payment_intent_id", { length: 255 }).notNull(),
	status: orderStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("orders_payment_intent_id_key").on(table.paymentIntentId),
]);

export const licenses = pgTable("licenses", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	licenseKey: varchar("license_key", { length: 64 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	productId: varchar("product_id", { length: 100 }).notNull(),
	status: licenseStatus().default('active').notNull(),
	downloadsCount: integer("downloads_count").default(0).notNull(),
	maxDownloads: integer("max_downloads").default(10).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "licenses_order_id_fkey"
		}).onDelete("cascade"),
	unique("licenses_license_key_key").on(table.licenseKey),
]);

export const blogCategories = pgTable("blog_categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	description: text(),
	icon: varchar({ length: 50 }).default('i-heroicons-folder'),
	color: varchar({ length: 30 }).default('#10B981'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("blog_categories_slug_key").on(table.slug),
]);

export const blogSubcategories = pgTable("blog_subcategories", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [blogCategories.id],
			name: "blog_subcategories_category_id_fkey"
		}).onDelete("cascade"),
	unique("blog_subcategories_slug_key").on(table.slug),
]);

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: text(),
	categoryId: integer("category_id"),
	subcategoryId: integer("subcategory_id"),
	authorId: integer("author_id").notNull(),
	status: varchar({ length: 20 }).default('pending_vault').notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	vaultCertificateId: varchar("vault_certificate_id", { length: 100 }),
	vaultHash: varchar("vault_hash", { length: 64 }),
	views: integer().default(0).notNull(),
	likes: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [blogCategories.id],
			name: "blog_posts_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.subcategoryId],
			foreignColumns: [blogSubcategories.id],
			name: "blog_posts_subcategory_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blog_posts_author_id_fkey"
		}).onDelete("cascade"),
	unique("blog_posts_slug_key").on(table.slug),
]);

export const xpTransactions = pgTable("xp_transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	action: text().notNull(),
	points: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "xp_transactions_user_id_fkey"
		}),
]);
