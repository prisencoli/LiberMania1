import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  userBooks, type UserBook, type InsertUserBook,
  bookReviews, type BookReview, type InsertBookReview,
  favorites, type Favorite, type InsertFavorite,
  exchanges, type Exchange, type InsertExchange,
  exchangeMessages, type ExchangeMessage, type InsertExchangeMessage,
  exchangeFeedbacks, type ExchangeFeedback,
  walletTransactions, type WalletTransaction, type InsertWalletTransaction,
  notifications, type Notification,
  ExchangeStatus, UserBookStatus
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Book related
  getBook(id: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  searchBooks(query: string): Promise<Book[]>;
  getAllBooks(): Promise<Book[]>;
  
  // UserBook (collection) related
  getUserBook(id: number): Promise<UserBook | undefined>;
  getUserBooks(userId: number): Promise<UserBook[]>;
  getUserBookWithDetails(id: number): Promise<(UserBook & { book: Book, user: User }) | undefined>;
  getAvailableUserBooks(options?: { limit?: number, offset?: number, query?: string, categoryId?: number }): Promise<(UserBook & { book: Book, user: User })[]>;
  getAvailableUserBooksByBookId(bookId: number): Promise<(UserBook & { user: User })[]>;
  createUserBook(userBook: InsertUserBook): Promise<UserBook>;
  updateUserBook(id: number, updates: Partial<UserBook>): Promise<UserBook | undefined>;
  deleteUserBook(id: number): Promise<boolean>;
  
  // BookReview related
  getBookReview(id: number): Promise<BookReview | undefined>;
  getBookReviewsByBookId(bookId: number): Promise<(BookReview & { user: User })[]>;
  getBookReviewsByUserId(userId: number): Promise<(BookReview & { book: Book })[]>;
  createBookReview(review: InsertBookReview): Promise<BookReview>;
  
  // Favorites related
  getFavorite(userId: number, bookId: number): Promise<Favorite | undefined>;
  getUserFavorites(userId: number): Promise<(Favorite & { book: Book })[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, bookId: number): Promise<boolean>;
  
  // Exchange related
  getExchange(id: number): Promise<Exchange | undefined>;
  getExchangeWithDetails(id: number): Promise<(Exchange & { 
    offerer: User, 
    receiver: User, 
    offeredUserBook?: UserBook & { book: Book },
    requestedUserBook: UserBook & { book: Book }
  }) | undefined>;
  getUserExchanges(userId: number, type?: "sent" | "received"): Promise<(Exchange & { 
    offerer: User, 
    receiver: User, 
    offeredUserBook?: UserBook & { book: Book },
    requestedUserBook: UserBook & { book: Book }
  })[]>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchangeStatus(id: number, status: ExchangeStatus): Promise<Exchange | undefined>;
  
  // Exchange Message related
  getExchangeMessages(exchangeId: number): Promise<(ExchangeMessage & { sender: User })[]>;
  createExchangeMessage(message: InsertExchangeMessage): Promise<ExchangeMessage>;
  
  // Wallet Transaction related
  getWalletBalance(userId: number): Promise<number>;
  getWalletTransactions(userId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  
  // Notification related
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notification: Pick<Notification, 'userId' | 'type' | 'content' | 'relatedEntityId' | 'relatedEntityType'>): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private userBooks: Map<number, UserBook>;
  private bookReviews: Map<number, BookReview>;
  private favorites: Map<number, Favorite>;
  private exchanges: Map<number, Exchange>;
  private exchangeMessages: Map<number, ExchangeMessage>;
  private exchangeFeedbacks: Map<number, ExchangeFeedback>;
  private walletTransactions: Map<number, WalletTransaction>;
  private notifications: Map<number, Notification>;
  
  userCurrentId: number = 1;
  bookCurrentId: number = 1;
  userBookCurrentId: number = 1;
  bookReviewCurrentId: number = 1;
  favoriteCurrentId: number = 1;
  exchangeCurrentId: number = 1;
  exchangeMessageCurrentId: number = 1;
  exchangeFeedbackCurrentId: number = 1;
  walletTransactionCurrentId: number = 1;
  notificationCurrentId: number = 1;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.userBooks = new Map();
    this.bookReviews = new Map();
    this.favorites = new Map();
    this.exchanges = new Map();
    this.exchangeMessages = new Map();
    this.exchangeFeedbacks = new Map();
    this.walletTransactions = new Map();
    this.notifications = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      role: "user",
      credits: 50,
      averageRating: 0,
      totalRatings: 0,
      completedExchanges: 0,
      locationConsent: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Book methods
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBookByIsbn(isbn: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(book => book.isbn === isbn);
  }
  
  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookCurrentId++;
    const now = new Date();
    const book: Book = { ...insertBook, id, createdAt: now };
    this.books.set(id, book);
    return book;
  }
  
  async searchBooks(query: string): Promise<Book[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(book => 
      book.title.toLowerCase().includes(lowerQuery) || 
      book.author.toLowerCase().includes(lowerQuery) ||
      book.isbn.includes(lowerQuery)
    );
  }
  
  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  // UserBook methods
  async getUserBook(id: number): Promise<UserBook | undefined> {
    return this.userBooks.get(id);
  }
  
  async getUserBooks(userId: number): Promise<UserBook[]> {
    return Array.from(this.userBooks.values()).filter(ub => ub.userId === userId);
  }
  
  async getUserBookWithDetails(id: number): Promise<(UserBook & { book: Book, user: User }) | undefined> {
    const userBook = await this.getUserBook(id);
    if (!userBook) return undefined;
    
    const book = await this.getBook(userBook.bookId);
    const user = await this.getUser(userBook.userId);
    
    if (!book || !user) return undefined;
    
    return { ...userBook, book, user };
  }
  
  async getAvailableUserBooks(options: { limit?: number, offset?: number, query?: string, categoryId?: number } = {}): Promise<(UserBook & { book: Book, user: User })[]> {
    const { limit = 20, offset = 0, query, categoryId } = options;
    
    let availableBooks = Array.from(this.userBooks.values())
      .filter(ub => ub.status === "AVAILABLE")
      .map(async ub => {
        const book = await this.getBook(ub.bookId);
        const user = await this.getUser(ub.userId);
        if (!book || !user) return null;
        return { ...ub, book, user };
      });
    
    const resolvedBooks = (await Promise.all(availableBooks)).filter(book => book !== null) as (UserBook & { book: Book, user: User })[];
    
    // Apply filters
    let filteredBooks = resolvedBooks;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredBooks = filteredBooks.filter(ub => 
        ub.book.title.toLowerCase().includes(lowerQuery) || 
        ub.book.author.toLowerCase().includes(lowerQuery) ||
        ub.book.isbn.includes(lowerQuery) ||
        ub.user.nickname.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (categoryId) {
      filteredBooks = filteredBooks.filter(ub => 
        ub.book.categories && ub.book.categories.includes(categoryId.toString())
      );
    }
    
    // Prioritize boosted books
    filteredBooks.sort((a, b) => {
      // First sort by boost status
      if (a.boostActive && !b.boostActive) return -1;
      if (!a.boostActive && b.boostActive) return 1;
      
      // Then by recency if boost status is the same
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply pagination
    return filteredBooks.slice(offset, offset + limit);
  }
  
  async getAvailableUserBooksByBookId(bookId: number): Promise<(UserBook & { user: User })[]> {
    const userBooks = Array.from(this.userBooks.values())
      .filter(ub => ub.bookId === bookId && ub.status === "AVAILABLE");
    
    const detailedUserBooks = await Promise.all(userBooks.map(async ub => {
      const user = await this.getUser(ub.userId);
      if (!user) return null;
      return { ...ub, user };
    }));
    
    return detailedUserBooks.filter(ub => ub !== null) as (UserBook & { user: User })[];
  }
  
  async createUserBook(insertUserBook: InsertUserBook): Promise<UserBook> {
    const id = this.userBookCurrentId++;
    const now = new Date();
    const userBook: UserBook = { 
      ...insertUserBook, 
      id, 
      isInShowcase: false,
      boostActive: false,
      currentBoostViews: 0,
      currentBoostClicks: 0,
      imageUrls: [],
      createdAt: now,
      updatedAt: now
    };
    this.userBooks.set(id, userBook);
    return userBook;
  }
  
  async updateUserBook(id: number, updates: Partial<UserBook>): Promise<UserBook | undefined> {
    const userBook = await this.getUserBook(id);
    if (!userBook) return undefined;
    
    const now = new Date();
    const updatedUserBook = { 
      ...userBook, 
      ...updates,
      updatedAt: now
    };
    this.userBooks.set(id, updatedUserBook);
    return updatedUserBook;
  }
  
  async deleteUserBook(id: number): Promise<boolean> {
    return this.userBooks.delete(id);
  }

  // BookReview methods
  async getBookReview(id: number): Promise<BookReview | undefined> {
    return this.bookReviews.get(id);
  }
  
  async getBookReviewsByBookId(bookId: number): Promise<(BookReview & { user: User })[]> {
    const reviews = Array.from(this.bookReviews.values())
      .filter(review => review.bookId === bookId);
    
    const detailedReviews = await Promise.all(reviews.map(async review => {
      const user = await this.getUser(review.userId);
      if (!user) return null;
      return { ...review, user };
    }));
    
    return detailedReviews.filter(review => review !== null) as (BookReview & { user: User })[];
  }
  
  async getBookReviewsByUserId(userId: number): Promise<(BookReview & { book: Book })[]> {
    const reviews = Array.from(this.bookReviews.values())
      .filter(review => review.userId === userId);
    
    const detailedReviews = await Promise.all(reviews.map(async review => {
      const book = await this.getBook(review.bookId);
      if (!book) return null;
      return { ...review, book };
    }));
    
    return detailedReviews.filter(review => review !== null) as (BookReview & { book: Book })[];
  }
  
  async createBookReview(insertReview: InsertBookReview): Promise<BookReview> {
    const id = this.bookReviewCurrentId++;
    const now = new Date();
    const review: BookReview = { ...insertReview, id, createdAt: now };
    this.bookReviews.set(id, review);
    return review;
  }

  // Favorites methods
  async getFavorite(userId: number, bookId: number): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.bookId === bookId
    );
  }
  
  async getUserFavorites(userId: number): Promise<(Favorite & { book: Book })[]> {
    const favorites = Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId);
    
    const detailedFavorites = await Promise.all(favorites.map(async fav => {
      const book = await this.getBook(fav.bookId);
      if (!book) return null;
      return { ...fav, book };
    }));
    
    return detailedFavorites.filter(fav => fav !== null) as (Favorite & { book: Book })[];
  }
  
  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteCurrentId++;
    const now = new Date();
    const favorite: Favorite = { ...insertFavorite, id, createdAt: now };
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async deleteFavorite(userId: number, bookId: number): Promise<boolean> {
    const favorite = await this.getFavorite(userId, bookId);
    if (!favorite) return false;
    
    return this.favorites.delete(favorite.id);
  }

  // Exchange methods
  async getExchange(id: number): Promise<Exchange | undefined> {
    return this.exchanges.get(id);
  }
  
  async getExchangeWithDetails(id: number): Promise<(Exchange & { 
    offerer: User, 
    receiver: User, 
    offeredUserBook?: UserBook & { book: Book },
    requestedUserBook: UserBook & { book: Book }
  }) | undefined> {
    const exchange = await this.getExchange(id);
    if (!exchange) return undefined;
    
    const offerer = await this.getUser(exchange.offererId);
    const receiver = await this.getUser(exchange.receiverId);
    const requestedUserBook = await this.getUserBookWithDetails(exchange.requestedUserBookId);
    
    if (!offerer || !receiver || !requestedUserBook) return undefined;
    
    let offeredUserBook: (UserBook & { book: Book }) | undefined = undefined;
    if (exchange.offeredUserBookId) {
      offeredUserBook = await this.getUserBookWithDetails(exchange.offeredUserBookId);
    }
    
    return { 
      ...exchange, 
      offerer, 
      receiver, 
      offeredUserBook, 
      requestedUserBook 
    };
  }
  
  async getUserExchanges(userId: number, type?: "sent" | "received"): Promise<(Exchange & { 
    offerer: User, 
    receiver: User, 
    offeredUserBook?: UserBook & { book: Book },
    requestedUserBook: UserBook & { book: Book }
  })[]> {
    const exchanges = Array.from(this.exchanges.values()).filter(exchange => {
      if (type === "sent") return exchange.offererId === userId;
      if (type === "received") return exchange.receiverId === userId;
      return exchange.offererId === userId || exchange.receiverId === userId;
    });
    
    const detailedExchanges = await Promise.all(exchanges.map(async exchange => {
      try {
        return await this.getExchangeWithDetails(exchange.id);
      } catch (error) {
        return null;
      }
    }));
    
    return detailedExchanges.filter(ex => ex !== null) as (Exchange & { 
      offerer: User, 
      receiver: User, 
      offeredUserBook?: UserBook & { book: Book },
      requestedUserBook: UserBook & { book: Book }
    })[];
  }
  
  async createExchange(insertExchange: InsertExchange): Promise<Exchange> {
    const id = this.exchangeCurrentId++;
    const now = new Date();
    const exchange: Exchange = { 
      ...insertExchange, 
      status: "PENDING", 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.exchanges.set(id, exchange);
    return exchange;
  }
  
  async updateExchangeStatus(id: number, status: ExchangeStatus): Promise<Exchange | undefined> {
    const exchange = await this.getExchange(id);
    if (!exchange) return undefined;
    
    const now = new Date();
    const updatedExchange = { 
      ...exchange, 
      status,
      updatedAt: now
    };
    this.exchanges.set(id, updatedExchange);
    return updatedExchange;
  }

  // Exchange Message methods
  async getExchangeMessages(exchangeId: number): Promise<(ExchangeMessage & { sender: User })[]> {
    const messages = Array.from(this.exchangeMessages.values())
      .filter(msg => msg.exchangeId === exchangeId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const detailedMessages = await Promise.all(messages.map(async msg => {
      const sender = await this.getUser(msg.senderId);
      if (!sender) return null;
      return { ...msg, sender };
    }));
    
    return detailedMessages.filter(msg => msg !== null) as (ExchangeMessage & { sender: User })[];
  }
  
  async createExchangeMessage(insertMessage: InsertExchangeMessage): Promise<ExchangeMessage> {
    const id = this.exchangeMessageCurrentId++;
    const now = new Date();
    const message: ExchangeMessage = { ...insertMessage, id, createdAt: now };
    this.exchangeMessages.set(id, message);
    return message;
  }

  // Wallet Transaction methods
  async getWalletBalance(userId: number): Promise<number> {
    const transactions = Array.from(this.walletTransactions.values())
      .filter(tx => tx.userId === userId);
    
    return transactions.reduce((balance, tx) => {
      if (tx.type === "EARNED" || tx.type === "REFUNDED") {
        return balance + tx.amount;
      } else if (tx.type === "SPENT") {
        return balance - tx.amount;
      }
      return balance;
    }, 0);
  }
  
  async getWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    return Array.from(this.walletTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createWalletTransaction(insertTransaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const id = this.walletTransactionCurrentId++;
    const now = new Date();
    const transaction: WalletTransaction = { ...insertTransaction, id, createdAt: now };
    this.walletTransactions.set(id, transaction);
    
    // Update user's credit balance
    const user = await this.getUser(insertTransaction.userId);
    if (user) {
      let newCredits = user.credits;
      
      if (insertTransaction.type === "EARNED" || insertTransaction.type === "REFUNDED") {
        newCredits += insertTransaction.amount;
      } else if (insertTransaction.type === "SPENT") {
        newCredits -= insertTransaction.amount;
      }
      
      await this.updateUser(user.id, { credits: newCredits });
    }
    
    return transaction;
  }

  // Notification methods
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createNotification(notification: Pick<Notification, 'userId' | 'type' | 'content' | 'relatedEntityId' | 'relatedEntityType'>): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const now = new Date();
    const newNotification: Notification = { 
      ...notification, 
      id, 
      read: false,
      createdAt: now
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.read = true;
    this.notifications.set(id, notification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read);
    
    for (const notification of userNotifications) {
      notification.read = true;
      this.notifications.set(notification.id, notification);
    }
    
    return true;
  }
}

export const storage = new MemStorage();
