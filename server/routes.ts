import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { searchBookByIsbn, searchBooks } from "./googlebooks";
import { 
  AddBookByIsbnData, BookReviewData, ProposeExchangeData, UpdateProfileData, 
  addBookByIsbnSchema, bookReviewSchema, proposeExchangeSchema, updateProfileSchema,
  UserBookStatus, ExchangeStatus, ExchangeOfferType
} from "@shared/schema";

// WebSocket clients storage
interface WsClient {
  userId: number;
  socket: WebSocket;
  rooms: Set<string>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  const httpServer = createServer(app);
  
  // WebSocket server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const wsClients: Map<WebSocket, WsClient> = new Map();
  
  // WebSocket connection handler
  wss.on("connection", (socket) => {
    console.log("WebSocket client connected");
    
    socket.on("message", async (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());
        
        // Handle authentication
        if (data.type === "authenticate") {
          const { userId, token } = data;
          
          // In a real app, we would validate the token
          // For this MVP, we'll just check if the user exists
          const user = await storage.getUser(userId);
          if (!user) {
            socket.send(JSON.stringify({ type: "error", message: "Authentication failed" }));
            return;
          }
          
          // Store client info
          wsClients.set(socket, { userId, socket, rooms: new Set() });
          socket.send(JSON.stringify({ type: "authenticated" }));
          return;
        }
        
        // All other messages require authentication
        const client = wsClients.get(socket);
        if (!client) {
          socket.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
          return;
        }
        
        // Handle joining exchange room
        if (data.type === "joinExchangeRoom") {
          const { exchangeId } = data;
          
          // Verify user is part of this exchange
          const exchange = await storage.getExchangeWithDetails(exchangeId);
          if (!exchange || (exchange.offererId !== client.userId && exchange.receiverId !== client.userId)) {
            socket.send(JSON.stringify({ type: "error", message: "Not authorized to join this exchange room" }));
            return;
          }
          
          const roomId = `exchange:${exchangeId}`;
          client.rooms.add(roomId);
          
          // Send message history
          const messages = await storage.getExchangeMessages(exchangeId);
          socket.send(JSON.stringify({ 
            type: "messageHistory", 
            exchangeId, 
            messages: messages 
          }));
          
          socket.send(JSON.stringify({ type: "joinedRoom", roomId }));
          return;
        }
        
        // Handle leaving exchange room
        if (data.type === "leaveExchangeRoom") {
          const { exchangeId } = data;
          const roomId = `exchange:${exchangeId}`;
          client.rooms.delete(roomId);
          socket.send(JSON.stringify({ type: "leftRoom", roomId }));
          return;
        }
        
        // Handle sending message to exchange room
        if (data.type === "sendExchangeMessage") {
          const { exchangeId, content } = data;
          
          // Basic content filter for inappropriate content
          const inappropriateWords = ["badword1", "badword2"]; // Add more as needed
          const containsInappropriate = inappropriateWords.some(word => 
            content.toLowerCase().includes(word.toLowerCase())
          );
          
          if (containsInappropriate) {
            socket.send(JSON.stringify({ 
              type: "message_blocked", 
              message: "Your message contains inappropriate content" 
            }));
            return;
          }
          
          // Verify user is part of this exchange
          const exchange = await storage.getExchangeWithDetails(exchangeId);
          if (!exchange || (exchange.offererId !== client.userId && exchange.receiverId !== client.userId)) {
            socket.send(JSON.stringify({ type: "error", message: "Not authorized to send messages to this exchange" }));
            return;
          }
          
          // Save message
          const message = await storage.createExchangeMessage({
            exchangeId,
            senderId: client.userId,
            content
          });
          
          // Get sender details
          const sender = await storage.getUser(client.userId);
          if (!sender) return;
          
          const newMessage = { ...message, sender };
          
          // Broadcast to all clients in the room
          const roomId = `exchange:${exchangeId}`;
          for (const [_, otherClient] of wsClients.entries()) {
            if (otherClient.rooms.has(roomId)) {
              otherClient.socket.send(JSON.stringify({ 
                type: "newMessage", 
                exchangeId, 
                message: newMessage 
              }));
            }
          }
          
          // Create notification for receiver
          const recipientId = client.userId === exchange.offererId ? exchange.receiverId : exchange.offererId;
          await storage.createNotification({
            userId: recipientId,
            type: "NEW_MESSAGE",
            content: `You have a new message from ${sender.nickname}`,
            relatedEntityId: exchangeId,
            relatedEntityType: "exchange"
          });
          
          return;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });
    
    socket.on("close", () => {
      wsClients.delete(socket);
    });
  });
  
  // Books API
  
  // Get book by ISBN
  app.get("/api/books/isbn/:isbn", async (req, res) => {
    try {
      const { isbn } = req.params;
      
      // Check if book exists in our database
      let book = await storage.getBookByIsbn(isbn);
      
      if (!book) {
        // If not, fetch from Google Books API
        const bookData = await searchBookByIsbn(isbn);
        
        if (!bookData) {
          return res.status(404).json({ message: "Book not found" });
        }
        
        // Save to our database
        book = await storage.createBook(bookData);
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error fetching book by ISBN:", error);
      res.status(500).json({ message: "Error fetching book" });
    }
  });
  
  // Search books for review
  app.get("/api/books/search", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      // First search in our local database
      let books = await storage.searchBooks(query);
      
      // If not enough results, search via Google Books API
      if (books.length < 5) {
        const googleBooks = await searchBooks(query);
        
        // Filter out books we already have
        const existingIsbns = new Set(books.map(book => book.isbn));
        const newGoogleBooks = googleBooks.filter(book => !existingIsbns.has(book.isbn));
        
        // Save new books to our database
        for (const bookData of newGoogleBooks) {
          const savedBook = await storage.createBook(bookData);
          books.push(savedBook);
        }
      }
      
      res.json(books);
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ message: "Error searching books" });
    }
  });
  
  // Get book details by ID
  app.get("/api/books/:bookId/details", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error fetching book details:", error);
      res.status(500).json({ message: "Error fetching book details" });
    }
  });
  
  // Get available copies of a book
  app.get("/api/books/:bookId/available-copies", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const availableCopies = await storage.getAvailableUserBooksByBookId(bookId);
      
      res.json(availableCopies);
    } catch (error) {
      console.error("Error fetching available copies:", error);
      res.status(500).json({ message: "Error fetching available copies" });
    }
  });
  
  // Get reviews for a book
  app.get("/api/books/:bookId/reviews", async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const reviews = await storage.getBookReviewsByBookId(bookId);
      
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching book reviews:", error);
      res.status(500).json({ message: "Error fetching book reviews" });
    }
  });
  
  // Get available books with filters
  app.get("/api/books/available", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const query = req.query.search as string | undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      const availableBooks = await storage.getAvailableUserBooks({ limit, offset, query, categoryId });
      
      // Increment boost views for boosted books
      for (const userBook of availableBooks) {
        if (userBook.boostActive) {
          await storage.updateUserBook(userBook.id, { 
            currentBoostViews: userBook.currentBoostViews + 1 
          });
        }
      }
      
      res.json(availableBooks);
    } catch (error) {
      console.error("Error fetching available books:", error);
      res.status(500).json({ message: "Error fetching available books" });
    }
  });
  
  // Track user click on boosted book
  app.post("/api/books/user-book/:userBookId/boost-click", async (req, res) => {
    try {
      const userBookId = parseInt(req.params.userBookId);
      
      if (isNaN(userBookId)) {
        return res.status(400).json({ message: "Invalid user book ID" });
      }
      
      const userBook = await storage.getUserBook(userBookId);
      
      if (!userBook || !userBook.boostActive) {
        return res.status(404).json({ message: "Boosted book not found" });
      }
      
      await storage.updateUserBook(userBookId, { 
        currentBoostClicks: userBook.currentBoostClicks + 1 
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking boost click:", error);
      res.status(500).json({ message: "Error tracking boost click" });
    }
  });
  
  // Protected routes
  
  // Add book to user's collection
  app.post("/api/books/my-collection", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const result = addBookByIsbnSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: result.error.errors 
        });
      }
      
      const data = result.data as AddBookByIsbnData;
      
      // Get or create book record
      let book = await storage.getBookByIsbn(data.isbn);
      
      if (!book) {
        const bookData = await searchBookByIsbn(data.isbn);
        
        if (!bookData) {
          return res.status(404).json({ message: "Book not found" });
        }
        
        book = await storage.createBook(bookData);
      }
      
      // Create user book record
      const userBook = await storage.createUserBook({
        userId: req.user.id,
        bookId: book.id,
        condition: data.condition,
        conditionDescription: data.conditionDescription,
        status: "NOT_AVAILABLE" as UserBookStatus
      });
      
      // Award bonus credits for adding a book
      await storage.createWalletTransaction({
        userId: req.user.id,
        amount: 10,
        type: "EARNED",
        description: "Book added to collection bonus"
      });
      
      // Create notification
      await storage.createNotification({
        userId: req.user.id,
        type: "CREDITS_EARNED",
        content: "You earned 10 credits for adding a book to your collection!",
        relatedEntityId: userBook.id,
        relatedEntityType: "userBook"
      });
      
      res.status(201).json(userBook);
    } catch (error) {
      console.error("Error adding book to collection:", error);
      res.status(500).json({ message: "Error adding book to collection" });
    }
  });
  
  // Get user's books
  app.get("/api/books/my-collection", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userBooks = await storage.getUserBooks(req.user.id);
      
      // Enrich with book details
      const enrichedUserBooks = await Promise.all(userBooks.map(async (userBook) => {
        const book = await storage.getBook(userBook.bookId);
        return { ...userBook, book };
      }));
      
      res.json(enrichedUserBooks);
    } catch (error) {
      console.error("Error fetching user's books:", error);
      res.status(500).json({ message: "Error fetching user's books" });
    }
  });
  
  // Update user book status
  app.patch("/api/books/my-collection/:userBookId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userBookId = parseInt(req.params.userBookId);
      
      if (isNaN(userBookId)) {
        return res.status(400).json({ message: "Invalid user book ID" });
      }
      
      const userBook = await storage.getUserBook(userBookId);
      
      if (!userBook) {
        return res.status(404).json({ message: "User book not found" });
      }
      
      // Verify ownership
      if (userBook.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Updates can include status, conditionDescription, etc.
      const updates = req.body;
      const allowedFields = ["status", "conditionDescription", "isInShowcase"];
      
      const filteredUpdates: Partial<UserBook> = {};
      for (const field of allowedFields) {
        if (field in updates) {
          filteredUpdates[field as keyof UserBook] = updates[field];
        }
      }
      
      const updatedUserBook = await storage.updateUserBook(userBookId, filteredUpdates);
      
      // If book is now available, notify users who have it in their wishlist
      if (filteredUpdates.status === "AVAILABLE" && userBook.status !== "AVAILABLE") {
        // In a real app, we would query users who have this book in their wishlist
        // and send them notifications
      }
      
      res.json(updatedUserBook);
    } catch (error) {
      console.error("Error updating user book:", error);
      res.status(500).json({ message: "Error updating user book" });
    }
  });
  
  // Delete user book
  app.delete("/api/books/my-collection/:userBookId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userBookId = parseInt(req.params.userBookId);
      
      if (isNaN(userBookId)) {
        return res.status(400).json({ message: "Invalid user book ID" });
      }
      
      const userBook = await storage.getUserBook(userBookId);
      
      if (!userBook) {
        return res.status(404).json({ message: "User book not found" });
      }
      
      // Verify ownership
      if (userBook.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Check if it's part of any active exchanges
      // In a real app, we would check this
      
      const deleted = await storage.deleteUserBook(userBookId);
      
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting user book:", error);
      res.status(500).json({ message: "Error deleting user book" });
    }
  });
  
  // User profile and preferences API
  
  // Update user profile
  app.patch("/api/users/me/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const result = updateProfileSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: result.error.errors 
        });
      }
      
      const data = result.data as UpdateProfileData;
      
      const updatedUser = await storage.updateUser(req.user.id, data);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });
  
  // Add book to favorites/wishlist
  app.post("/api/users/me/favorites/:bookId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Check if already in favorites
      const existingFavorite = await storage.getFavorite(req.user.id, bookId);
      
      if (existingFavorite) {
        return res.status(409).json({ message: "Book already in favorites" });
      }
      
      const favorite = await storage.createFavorite({
        userId: req.user.id,
        bookId
      });
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding book to favorites:", error);
      res.status(500).json({ message: "Error adding book to favorites" });
    }
  });
  
  // Remove book from favorites/wishlist
  app.delete("/api/users/me/favorites/:bookId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const bookId = parseInt(req.params.bookId);
      
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }
      
      const deleted = await storage.deleteFavorite(req.user.id, bookId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Book not in favorites" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing book from favorites:", error);
      res.status(500).json({ message: "Error removing book from favorites" });
    }
  });
  
  // Get user's favorites/wishlist
  app.get("/api/users/me/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const favorites = await storage.getUserFavorites(req.user.id);
      
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Error fetching favorites" });
    }
  });
  
  // Exchanges API
  
  // Create exchange proposal
  app.post("/api/exchanges", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const result = proposeExchangeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: result.error.errors 
        });
      }
      
      const data = result.data as ProposeExchangeData;
      
      // Get the requested book
      const requestedUserBook = await storage.getUserBookWithDetails(data.requestedUserBookId);
      
      if (!requestedUserBook) {
        return res.status(404).json({ message: "Requested book not found" });
      }
      
      // Verify book is available
      if (requestedUserBook.status !== "AVAILABLE") {
        return res.status(400).json({ message: "Requested book is not available" });
      }
      
      // Verify not requesting own book
      if (requestedUserBook.userId === req.user.id) {
        return res.status(400).json({ message: "Cannot request your own book" });
      }
      
      const insertExchange: any = {
        offererId: req.user.id,
        receiverId: requestedUserBook.userId,
        requestedUserBookId: data.requestedUserBookId,
        offerType: data.offerType,
        message: data.message || ""
      };
      
      // Handle offer type specific validation
      if (data.offerType === "BOOK") {
        if (!data.offeredUserBookId) {
          return res.status(400).json({ message: "Offered book ID is required for book-to-book exchanges" });
        }
        
        // Verify offered book exists and is owned by the user
        const offeredUserBook = await storage.getUserBook(data.offeredUserBookId);
        
        if (!offeredUserBook) {
          return res.status(404).json({ message: "Offered book not found" });
        }
        
        if (offeredUserBook.userId !== req.user.id) {
          return res.status(403).json({ message: "You do not own the offered book" });
        }
        
        // Verify offered book is available
        if (offeredUserBook.status !== "AVAILABLE") {
          return res.status(400).json({ message: "Offered book is not available" });
        }
        
        insertExchange.offeredUserBookId = data.offeredUserBookId;
        
        // Update offered book status
        await storage.updateUserBook(data.offeredUserBookId, { status: "NOT_AVAILABLE" });
      } else if (data.offerType === "CREDITS") {
        if (!data.creditAmount) {
          return res.status(400).json({ message: "Credit amount is required for credit-based exchanges" });
        }
        
        // Verify user has enough credits
        const userBalance = await storage.getWalletBalance(req.user.id);
        
        if (userBalance < data.creditAmount) {
          return res.status(400).json({ message: "Insufficient credits" });
        }
        
        insertExchange.creditAmount = data.creditAmount;
      }
      
      // Create the exchange
      const exchange = await storage.createExchange(insertExchange);
      
      // Notify the receiver
      await storage.createNotification({
        userId: requestedUserBook.userId,
        type: "EXCHANGE_REQUEST",
        content: `You have a new exchange request from ${req.user.nickname}`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      res.status(201).json(exchange);
    } catch (error) {
      console.error("Error creating exchange:", error);
      res.status(500).json({ message: "Error creating exchange" });
    }
  });
  
  // Get user's exchanges
  app.get("/api/exchanges", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const type = req.query.type as "sent" | "received" | undefined;
      
      const exchanges = await storage.getUserExchanges(req.user.id, type);
      
      res.json(exchanges);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ message: "Error fetching exchanges" });
    }
  });
  
  // Get exchange by ID
  app.get("/api/exchanges/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exchangeId = parseInt(req.params.id);
      
      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: "Invalid exchange ID" });
      }
      
      const exchange = await storage.getExchangeWithDetails(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Verify user is part of this exchange
      if (exchange.offererId !== req.user.id && exchange.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(exchange);
    } catch (error) {
      console.error("Error fetching exchange:", error);
      res.status(500).json({ message: "Error fetching exchange" });
    }
  });
  
  // Accept exchange
  app.patch("/api/exchanges/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exchangeId = parseInt(req.params.id);
      
      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: "Invalid exchange ID" });
      }
      
      const exchange = await storage.getExchangeWithDetails(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Only receiver can accept
      if (exchange.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Only pending exchanges can be accepted
      if (exchange.status !== "PENDING") {
        return res.status(400).json({ message: `Exchange is already ${exchange.status.toLowerCase()}` });
      }
      
      // Update exchange status
      const updatedExchange = await storage.updateExchangeStatus(exchangeId, "ACCEPTED");
      
      // Update requested book status (mark as not available)
      await storage.updateUserBook(exchange.requestedUserBookId, { status: "NOT_AVAILABLE" });
      
      // Notify the offerer
      await storage.createNotification({
        userId: exchange.offererId,
        type: "EXCHANGE_ACCEPTED",
        content: `${req.user.nickname} has accepted your exchange request!`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      res.json(updatedExchange);
    } catch (error) {
      console.error("Error accepting exchange:", error);
      res.status(500).json({ message: "Error accepting exchange" });
    }
  });
  
  // Reject exchange
  app.patch("/api/exchanges/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exchangeId = parseInt(req.params.id);
      
      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: "Invalid exchange ID" });
      }
      
      const exchange = await storage.getExchangeWithDetails(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Only receiver can reject
      if (exchange.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Only pending exchanges can be rejected
      if (exchange.status !== "PENDING") {
        return res.status(400).json({ message: `Exchange is already ${exchange.status.toLowerCase()}` });
      }
      
      // Update exchange status
      const updatedExchange = await storage.updateExchangeStatus(exchangeId, "REJECTED");
      
      // If book-to-book, make the offered book available again
      if (exchange.offerType === "BOOK" && exchange.offeredUserBookId) {
        await storage.updateUserBook(exchange.offeredUserBookId, { status: "AVAILABLE" });
      }
      
      // Notify the offerer
      await storage.createNotification({
        userId: exchange.offererId,
        type: "EXCHANGE_REJECTED",
        content: `${req.user.nickname} has rejected your exchange request.`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      res.json(updatedExchange);
    } catch (error) {
      console.error("Error rejecting exchange:", error);
      res.status(500).json({ message: "Error rejecting exchange" });
    }
  });
  
  // Cancel exchange (by offerer)
  app.patch("/api/exchanges/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exchangeId = parseInt(req.params.id);
      
      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: "Invalid exchange ID" });
      }
      
      const exchange = await storage.getExchangeWithDetails(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Only offerer can cancel
      if (exchange.offererId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Only pending exchanges can be canceled
      if (exchange.status !== "PENDING") {
        return res.status(400).json({ message: `Exchange is already ${exchange.status.toLowerCase()}` });
      }
      
      // Update exchange status
      const updatedExchange = await storage.updateExchangeStatus(exchangeId, "CANCELED");
      
      // If book-to-book, make the offered book available again
      if (exchange.offerType === "BOOK" && exchange.offeredUserBookId) {
        await storage.updateUserBook(exchange.offeredUserBookId, { status: "AVAILABLE" });
      }
      
      // Notify the receiver
      await storage.createNotification({
        userId: exchange.receiverId,
        type: "EXCHANGE_CANCELED",
        content: `${req.user.nickname} has canceled their exchange request.`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      res.json(updatedExchange);
    } catch (error) {
      console.error("Error canceling exchange:", error);
      res.status(500).json({ message: "Error canceling exchange" });
    }
  });
  
  // Complete exchange
  app.patch("/api/exchanges/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const exchangeId = parseInt(req.params.id);
      
      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: "Invalid exchange ID" });
      }
      
      const exchange = await storage.getExchangeWithDetails(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Either party can mark as complete
      if (exchange.offererId !== req.user.id && exchange.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Only accepted exchanges can be completed
      if (exchange.status !== "ACCEPTED") {
        return res.status(400).json({ message: `Exchange must be accepted before it can be completed` });
      }
      
      // Update exchange status
      const updatedExchange = await storage.updateExchangeStatus(exchangeId, "COMPLETED");
      
      // Update book statuses
      await storage.updateUserBook(exchange.requestedUserBookId, { status: "EXCHANGED" });
      
      if (exchange.offerType === "BOOK" && exchange.offeredUserBookId) {
        await storage.updateUserBook(exchange.offeredUserBookId, { status: "EXCHANGED" });
      } else if (exchange.offerType === "CREDITS" && exchange.creditAmount) {
        // Transfer credits
        await storage.createWalletTransaction({
          userId: req.user.id === exchange.offererId ? exchange.offererId : exchange.receiverId,
          amount: exchange.creditAmount,
          type: "SPENT",
          description: `Payment for book exchange #${exchange.id}`
        });
        
        await storage.createWalletTransaction({
          userId: req.user.id === exchange.offererId ? exchange.receiverId : exchange.offererId,
          amount: exchange.creditAmount,
          type: "EARNED",
          description: `Payment received for book exchange #${exchange.id}`
        });
      }
      
      // Update user stats
      const offerer = await storage.getUser(exchange.offererId);
      const receiver = await storage.getUser(exchange.receiverId);
      
      if (offerer) {
        await storage.updateUser(offerer.id, { 
          completedExchanges: (offerer.completedExchanges || 0) + 1 
        });
      }
      
      if (receiver) {
        await storage.updateUser(receiver.id, { 
          completedExchanges: (receiver.completedExchanges || 0) + 1 
        });
      }
      
      // Notify the other party
      const otherUserId = req.user.id === exchange.offererId ? exchange.receiverId : exchange.offererId;
      const otherUserNickname = req.user.id === exchange.offererId ? receiver?.nickname : offerer?.nickname;
      
      await storage.createNotification({
        userId: otherUserId,
        type: "EXCHANGE_COMPLETED",
        content: `${req.user.nickname} has marked your exchange as completed.`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      // Notify the current user as well
      await storage.createNotification({
        userId: req.user.id,
        type: "EXCHANGE_COMPLETED",
        content: `Your exchange with ${otherUserNickname} has been completed. Leave a feedback!`,
        relatedEntityId: exchange.id,
        relatedEntityType: "exchange"
      });
      
      res.json(updatedExchange);
    } catch (error) {
      console.error("Error completing exchange:", error);
      res.status(500).json({ message: "Error completing exchange" });
    }
  });
  
  // Reviews API
  
  // Submit book review
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const result = bookReviewSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: result.error.errors 
        });
      }
      
      const data = result.data as BookReviewData;
      
      // Check if book exists
      const book = await storage.getBook(data.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Check if user already reviewed this book
      const existingReviews = await storage.getBookReviewsByBookId(data.bookId);
      const userReview = existingReviews.find(review => review.userId === req.user.id);
      
      if (userReview) {
        return res.status(409).json({ message: "You have already reviewed this book" });
      }
      
      // Create review
      const review = await storage.createBookReview({
        bookId: data.bookId,
        userId: req.user.id,
        rating: data.rating,
        comment: data.comment
      });
      
      // Award bonus credits for writing a review
      await storage.createWalletTransaction({
        userId: req.user.id,
        amount: 5,
        type: "EARNED",
        description: "Book review bonus"
      });
      
      // Create notification
      await storage.createNotification({
        userId: req.user.id,
        type: "CREDITS_EARNED",
        content: "You earned 5 credits for writing a book review!",
        relatedEntityId: review.id,
        relatedEntityType: "review"
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ message: "Error submitting review" });
    }
  });
  
  // Get user's reviews
  app.get("/api/users/me/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const reviews = await storage.getBookReviewsByUserId(req.user.id);
      
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Error fetching user reviews" });
    }
  });
  
  // Wallet API
  
  // Get wallet balance
  app.get("/api/wallet/balance", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const balance = await storage.getWalletBalance(req.user.id);
      
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: "Error fetching wallet balance" });
    }
  });
  
  // Get wallet transactions
  app.get("/api/wallet/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const transactions = await storage.getWalletTransactions(req.user.id);
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: "Error fetching wallet transactions" });
    }
  });
  
  // Notifications API
  
  // Get notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const notifications = await storage.getUserNotifications(req.user.id, limit);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const marked = await storage.markNotificationAsRead(notificationId);
      
      if (!marked) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  });
  
  return httpServer;
}
