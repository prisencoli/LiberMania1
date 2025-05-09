import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Book, UserBook, User } from '@shared/schema';
import { getQueryFn } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import BookCard from '@/components/ui/book-card';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ExtendedUserBook = UserBook & { book: Book, user: User };

export default function AvailableBooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Build the query string
  const queryString = new URLSearchParams();
  if (debouncedSearch) queryString.append('search', debouncedSearch);
  if (categoryFilter) queryString.append('categoryId', categoryFilter);
  if (sortBy === 'recent') {
    queryString.append('sortBy', 'createdAt');
    queryString.append('sortOrder', 'desc');
  } else if (sortBy === 'title') {
    queryString.append('sortBy', 'title');
    queryString.append('sortOrder', 'asc');
  }
  
  // Fetch available books
  const { data: books, isLoading, error } = useQuery<ExtendedUserBook[]>({
    queryKey: [`/api/books/available?${queryString.toString()}`],
    enabled: true,
  });
  
  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: true,
  });
  
  return (
    <>
      <Helmet>
        <title>Browse Available Books - LiberMania</title>
        <meta name="description" content="Browse books available for exchange on LiberMania. Find your next great read!" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">Available Books</h1>
          
          <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center space-x-2">
            <div className="relative w-full md:w-64">
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-dark" />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((category: { id: number, name: string }) => (
                  <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="title">Title: A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator className="mb-8" />
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, index) => (
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
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">Error loading books. Please try again later.</div>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        ) : books?.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-16 w-16 text-neutral-medium mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No books found</h2>
            <p className="text-neutral-dark mb-8">
              {debouncedSearch || categoryFilter
                ? "Try adjusting your search or filter criteria."
                : "There are no books available for exchange yet. Be the first to add one!"}
            </p>
            <Button variant="default" onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setSortBy('recent');
            }} className="mr-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map((userBook) => (
              <BookCard key={userBook.id} userBook={userBook} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
