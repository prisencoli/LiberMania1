import { InsertBook } from "@shared/schema";

export interface GoogleBooksResponse {
  items: GoogleBookItem[];
  totalItems: number;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
    language?: string;
  };
}

export async function searchBookByIsbn(isbn: string): Promise<InsertBook | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const bookData = data.items[0].volumeInfo;
    
    // Find ISBN-10 and ISBN-13 if available
    let finalIsbn = isbn;
    if (bookData.industryIdentifiers) {
      const isbn13 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_13');
      if (isbn13) {
        finalIsbn = isbn13.identifier;
      } else {
        const isbn10 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_10');
        if (isbn10) {
          finalIsbn = isbn10.identifier;
        }
      }
    }
    
    // Extract year from publishedDate
    let publishedYear: number | undefined = undefined;
    if (bookData.publishedDate) {
      const dateMatch = bookData.publishedDate.match(/(\d{4})/);
      if (dateMatch) {
        publishedYear = parseInt(dateMatch[1], 10);
      }
    }
    
    // Create book object
    const book: InsertBook = {
      isbn: finalIsbn,
      title: bookData.title || 'Unknown Title',
      author: bookData.authors ? bookData.authors.join(', ') : 'Unknown Author',
      description: bookData.description || '',
      publisher: bookData.publisher || '',
      publishedYear,
      pageCount: bookData.pageCount || 0,
      coverImageUrl: bookData.imageLinks?.thumbnail || '',
      language: bookData.language || '',
      categories: bookData.categories || [],
      googleCategoriesRaw: JSON.stringify(bookData.categories || [])
    };
    
    return book;
  } catch (error) {
    console.error('Error fetching book from Google Books API:', error);
    return null;
  }
}

export async function searchBooks(query: string): Promise<InsertBook[]> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    const books: InsertBook[] = data.items.map(item => {
      const bookData = item.volumeInfo;
      
      // Find ISBN if available
      let isbn = '';
      if (bookData.industryIdentifiers) {
        const isbn13 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_13');
        if (isbn13) {
          isbn = isbn13.identifier;
        } else {
          const isbn10 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_10');
          if (isbn10) {
            isbn = isbn10.identifier;
          }
        }
      }
      
      // Skip books without ISBN
      if (!isbn) {
        return null;
      }
      
      // Extract year from publishedDate
      let publishedYear: number | undefined = undefined;
      if (bookData.publishedDate) {
        const dateMatch = bookData.publishedDate.match(/(\d{4})/);
        if (dateMatch) {
          publishedYear = parseInt(dateMatch[1], 10);
        }
      }
      
      // Create book object
      return {
        isbn,
        title: bookData.title || 'Unknown Title',
        author: bookData.authors ? bookData.authors.join(', ') : 'Unknown Author',
        description: bookData.description || '',
        publisher: bookData.publisher || '',
        publishedYear,
        pageCount: bookData.pageCount || 0,
        coverImageUrl: bookData.imageLinks?.thumbnail || '',
        language: bookData.language || '',
        categories: bookData.categories || [],
        googleCategoriesRaw: JSON.stringify(bookData.categories || [])
      };
    }).filter(book => book !== null) as InsertBook[];
    
    return books;
  } catch (error) {
    console.error('Error searching books from Google Books API:', error);
    return [];
  }
}
