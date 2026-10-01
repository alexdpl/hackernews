import { relations } from "drizzle-orm/relations";
import { users, jobs, posts, comments, vaultCerts, pulseStories, pulseUpvotes, votes, pulseMailMessages, pulseMailLogs, pulseComments, dkpCrawlerLicenses, dkpCrawlerLogs, orders, licenses, blogCategories, blogSubcategories, blogPosts, xpTransactions } from "./schema";

export const jobsRelations = relations(jobs, ({one}) => ({
	user: one(users, {
		fields: [jobs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	jobs: many(jobs),
	comments: many(comments),
	posts: many(posts),
	vaultCerts: many(vaultCerts),
	dkpCrawlerLicenses: many(dkpCrawlerLicenses),
	blogPosts: many(blogPosts),
	xpTransactions: many(xpTransactions),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	comments: many(comments),
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	votes: many(votes),
}));

export const vaultCertsRelations = relations(vaultCerts, ({one}) => ({
	user: one(users, {
		fields: [vaultCerts.userId],
		references: [users.id]
	}),
}));

export const pulseUpvotesRelations = relations(pulseUpvotes, ({one}) => ({
	pulseStory: one(pulseStories, {
		fields: [pulseUpvotes.storyId],
		references: [pulseStories.id]
	}),
}));

export const pulseStoriesRelations = relations(pulseStories, ({many}) => ({
	pulseUpvotes: many(pulseUpvotes),
	pulseComments: many(pulseComments),
}));

export const votesRelations = relations(votes, ({one}) => ({
	post: one(posts, {
		fields: [votes.postId],
		references: [posts.id]
	}),
}));

export const pulseMailLogsRelations = relations(pulseMailLogs, ({one}) => ({
	pulseMailMessage: one(pulseMailMessages, {
		fields: [pulseMailLogs.messageId],
		references: [pulseMailMessages.id]
	}),
}));

export const pulseMailMessagesRelations = relations(pulseMailMessages, ({many}) => ({
	pulseMailLogs: many(pulseMailLogs),
}));

export const pulseCommentsRelations = relations(pulseComments, ({one}) => ({
	pulseStory: one(pulseStories, {
		fields: [pulseComments.storyId],
		references: [pulseStories.id]
	}),
}));

export const dkpCrawlerLicensesRelations = relations(dkpCrawlerLicenses, ({one, many}) => ({
	user: one(users, {
		fields: [dkpCrawlerLicenses.userId],
		references: [users.id]
	}),
	dkpCrawlerLogs: many(dkpCrawlerLogs),
}));

export const dkpCrawlerLogsRelations = relations(dkpCrawlerLogs, ({one}) => ({
	dkpCrawlerLicense: one(dkpCrawlerLicenses, {
		fields: [dkpCrawlerLogs.licenseId],
		references: [dkpCrawlerLicenses.id]
	}),
}));

export const licensesRelations = relations(licenses, ({one}) => ({
	order: one(orders, {
		fields: [licenses.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({many}) => ({
	licenses: many(licenses),
}));

export const blogSubcategoriesRelations = relations(blogSubcategories, ({one, many}) => ({
	blogCategory: one(blogCategories, {
		fields: [blogSubcategories.categoryId],
		references: [blogCategories.id]
	}),
	blogPosts: many(blogPosts),
}));

export const blogCategoriesRelations = relations(blogCategories, ({many}) => ({
	blogSubcategories: many(blogSubcategories),
	blogPosts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({one}) => ({
	blogCategory: one(blogCategories, {
		fields: [blogPosts.categoryId],
		references: [blogCategories.id]
	}),
	blogSubcategory: one(blogSubcategories, {
		fields: [blogPosts.subcategoryId],
		references: [blogSubcategories.id]
	}),
	user: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id]
	}),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({one}) => ({
	user: one(users, {
		fields: [xpTransactions.userId],
		references: [users.id]
	}),
}));