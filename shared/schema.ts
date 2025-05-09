import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  nickname: text("nickname").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  credits: integer("credits").notNull().default(50),
  location: text("location"),
  locationConsent: boolean("location_consent").default(false),
  averageRating: doublePrecision("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  completedExchanges: integer("completed_exchanges").default(0),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Book model
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  isbn: text("isbn").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  publisher: text("publisher"),
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  coverImageUrl: text("cover_image_url"),
  language: text("language"),
  categories: text("categories").array(),
  googleCategoriesRaw: text("google_categories_raw"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// UserBook model (books in user's collection)
export const userBooks = pgTable("user_books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  condition: text("condition").notNull(),
  conditionDescription: text("condition_description"),
  status: text("status").notNull().default("NOT_AVAILABLE"), // NOT_AVAILABLE, AVAILABLE, EXCHANGED
  isInShowcase: boolean("is_in_showcase").default(false),
  imageUrls: text("image_urls").array(),
  boostActive: boolean("boost_active").default(false),
  boostPlacement: text("boost_placement"), // CATEGORY, HOMEPAGE
  boostExpiresAt: timestamp("boost_expires_at"),
  currentBoostViews: integer("current_boost_views").default(0),
  currentBoostClicks: integer("current_boost_clicks").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exchange model
export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  offererId: integer("offerer_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  offeredUserBookId: integer("offered_user_book_id").references(() => userBooks.id),
  requestedUserBookId: integer("requested_user_book_id").notNull().references(() => userBooks.id),
  offerType: text("offer_type").notNull(), // BOOK, CREDITS
  creditAmount: integer("credit_amount"),
  status: text("status").notNull().default("PENDING"), // PENDING, ACCEPTED, REJECTED, CANCELED, COMPLETED
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exchange Message model
export const exchangeMessages = pgTable("exchange_messages", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exchange Feedback model
export const exchangeFeedbacks = pgTable("exchange_feedbacks", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  revieweeId: integer("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Book Review model
export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userBookIdx: uniqueIndex("user_book_idx").on(table.userId, table.bookId),
  }
});

// Favorites / Wishlist model
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userBookIdx: uniqueIndex("user_book_fav_idx").on(table.userId, table.bookId),
  }
});

// Wallet Transaction model
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // EARNED, SPENT, REFUNDED
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), 
  content: text("content").notNull(),
  read: boolean("read").default(false),
  relatedEntityId: integer("related_entity_id"),
  relatedEntityType: text("related_entity_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    nickname: true
  });

// Schema for inserting books
export const insertBookSchema = createInsertSchema(books)
  .pick({
    isbn: true,
    title: true,
    author: true,
    description: true,
    publisher: true,
    publishedYear: true,
    pageCount: true,
    coverImageUrl: true,
    language: true,
    categories: true
  });

// Schema for inserting user books
export const insertUserBookSchema = createInsertSchema(userBooks)
  .pick({
    userId: true,
    bookId: true,
    condition: true,
    conditionDescription: true,
    status: true
  });

// Schema for inserting exchanges
export const insertExchangeSchema = createInsertSchema(exchanges)
  .pick({
    offererId: true,
    receiverId: true,
    offeredUserBookId: true,
    requestedUserBookId: true,
    offerType: true,
    creditAmount: true,
    message: true
  });

// Schema for inserting exchange messages
export const insertExchangeMessageSchema = createInsertSchema(exchangeMessages)
  .pick({
    exchangeId: true,
    senderId: true,
    content: true
  });

// Schema for inserting book reviews
export const insertBookReviewSchema = createInsertSchema(bookReviews)
  .pick({
    bookId: true,
    userId: true,
    rating: true,
    comment: true
  });

// Schema for inserting favorites
export const insertFavoriteSchema = createInsertSchema(favorites)
  .pick({
    userId: true,
    bookId: true
  });

// Schema for inserting wallet transactions
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions)
  .pick({
    userId: true,
    amount: true,
    type: true,
    description: true
  });

// Types
export type UserRole = "user" | "admin";
export type UserBookStatus = "NOT_AVAILABLE" | "AVAILABLE" | "EXCHANGED";
export type ExchangeStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED" | "COMPLETED";
export type ExchangeOfferType = "BOOK" | "CREDITS";
export type WalletTransactionType = "EARNED" | "SPENT" | "REFUNDED";
export type NotificationType = "EXCHANGE_REQUEST" | "EXCHANGE_ACCEPTED" | "EXCHANGE_REJECTED" | "EXCHANGE_CANCELED" | "EXCHANGE_COMPLETED" | "BOOK_AVAILABLE" | "FEEDBACK_RECEIVED" | "BOOST_ACTIVE" | "BOOST_EXPIRED" | "CREDITS_EARNED" | "CREDITS_SPENT" | "NEW_MESSAGE";

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type InsertUserBook = z.infer<typeof insertUserBookSchema>;
export type UserBook = typeof userBooks.$inferSelect;
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;
export type InsertExchangeMessage = z.infer<typeof insertExchangeMessageSchema>;
export type ExchangeMessage = typeof exchangeMessages.$inferSelect;
export type InsertBookReview = z.infer<typeof insertBookReviewSchema>;
export type BookReview = typeof bookReviews.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Create zod schemas for validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  nickname: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export const updateProfileSchema = z.object({
  nickname: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  locationConsent: z.boolean().optional(),
});

export const addBookByIsbnSchema = z.object({
  isbn: z.string().min(10, "ISBN must be at least 10 characters"),
  condition: z.string(),
  conditionDescription: z.string().optional(),
});

export const proposeExchangeSchema = z.object({
  requestedUserBookId: z.number(),
  offerType: z.enum(["BOOK", "CREDITS"]),
  offeredUserBookId: z.number().optional(),
  creditAmount: z.number().optional(),
  message: z.string().optional(),
});

export const bookReviewSchema = z.object({
  bookId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type AddBookByIsbnData = z.infer<typeof addBookByIsbnSchema>;
export type ProposeExchangeData = z.infer<typeof proposeExchangeSchema>;
export type BookReviewData = z.infer<typeof bookReviewSchema>;
