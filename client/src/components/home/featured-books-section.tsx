import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Book, UserBook, User } from '@shared/schema';
import BookCard from '@/components/ui/book-card';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ExtendedUserBook = UserBook & { book: Book, user: User };

export default function FeaturedBooksSection() {
  const [books, setBooks] = useState<ExtendedUserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/books/available?limit=5');
        
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        setBooks(data);
      } catch (err) {
        setError('Error loading books. Please try again later.');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, []);
  
  return (
    <section className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">Recently Added Books</h2>
          <Link href="/books/available" className="text-primary font-semibold hover:text-primary-dark transition duration-150 flex items-center">
            View All
            <ChevronRight className="h-5 w-5 ml-1" />
          </Link>
        </div>
        
        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex flex-col space-y-3">
                <Skeleton className="h-60 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-neutral-dark">
            {error}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-10 text-neutral-dark">
            No books available yet. Be the first to add one!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {books.map((userBook) => (
              <BookCard key={userBook.id} userBook={userBook} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
