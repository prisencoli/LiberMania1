import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams, Link as WouterLink } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Book, BookReview, User, UserBook } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StarRating from '@/components/ui/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  Calendar, 
  Book as BookIcon, 
  Globe, 
  Tag, 
  ArrowRight, 
  MessageSquare,
  Loader2
} from 'lucide-react';

type ExtendedBookReview = BookReview & { user: User };
type BookCopy = UserBook & { user: User };

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}/details`],
  });
  
  // Fetch available copies
  const { data: availableCopies, isLoading: isLoadingCopies } = useQuery<BookCopy[]>({
    queryKey: [`/api/books/${bookId}/available-copies`],
  });
  
  // Fetch reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<ExtendedBookReview[]>({
    queryKey: [`/api/books/${bookId}/reviews`],
  });
  
  // Fetch favorites (to check if this book is favorited)
  const { data: favorites } = useQuery<{book: Book}[]>({
    queryKey: ['/api/users/me/favorites'],
    enabled: !!user,
  });
  
  // Check if book is in user's favorites
  useEffect(() => {
    if (favorites && bookId) {
      const isFav = favorites.some(fav => fav.book.id === parseInt(bookId));
      setIsFavorited(isFav);
    }
  }, [favorites, bookId]);
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (bookId: number) => {
      if (isFavorited) {
        await apiRequest('DELETE', `/api/users/me/favorites/${bookId}`);
      } else {
        await apiRequest('POST', `/api/users/me/favorites/${bookId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/favorites'] });
      setIsFavorited(!isFavorited);
      toast({
        title: isFavorited ? 'Removed from Favorites' : 'Added to Favorites',
        description: isFavorited 
          ? 'Book has been removed from your wishlist.' 
          : 'Book has been added to your wishlist!',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleToggleFavorite = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add books to your favorites.',
        variant: 'destructive',
      });
      return;
    }
    toggleFavoriteMutation.mutate(parseInt(bookId));
  };
  
  const proposeExchange = (userBookId: number) => {
    navigate(`/exchanges/propose?requestedUserBookId=${userBookId}`);
  };
  
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  if (isLoadingBook) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Book not found</h1>
        <p className="mb-6">The book you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/books/available')}>Browse Books</Button>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{book.title} - LiberMania</title>
        <meta name="description" content={`${book.title} by ${book.author}. ${book.description?.substring(0, 150) || 'View details and find copies available for exchange on LiberMania.'}`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Book Cover and Actions */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <img 
                  src={book.coverImageUrl || `https://via.placeholder.com/300x450?text=${encodeURIComponent(book.title)}`}
                  alt={`${book.title} by ${book.author}`}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Button 
                  variant={isFavorited ? "default" : "outline"} 
                  onClick={handleToggleFavorite}
                  className={isFavorited ? "bg-accent text-white" : ""}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "In Wishlist" : "Add to Wishlist"}
                </Button>
                
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3">Book Details</h3>
                <div className="space-y-2 text-sm">
                  {book.publishedYear && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neutral-dark" />
                      <span>Published: {book.publishedYear}</span>
                    </div>
                  )}
                  {book.pageCount && (
                    <div className="flex items-center gap-2">
                      <BookIcon className="h-4 w-4 text-neutral-dark" />
                      <span>Pages: {book.pageCount}</span>
                    </div>
                  )}
                  {book.language && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-neutral-dark" />
                      <span>Language: {book.language}</span>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-neutral-dark" />
                      <span>Publisher: {book.publisher}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-neutral-dark" />
                    <span>ISBN: {book.isbn}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Book Details and Tabs */}
          <div className="md:w-2/3 lg:w-3/4">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">{book.title}</h1>
            <h2 className="text-xl text-neutral-dark mb-4">by {book.author}</h2>
            
            <div className="flex items-center mb-6">
              <StarRating rating={Math.round(averageRating)} size="medium" className="mr-2" />
              <span className="text-neutral-dark">
                {reviews?.length ? (
                  <>
                    {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </>
                ) : (
                  'No reviews yet'
                )}
              </span>
            </div>
            
            <Tabs defaultValue="about" className="mb-8">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="available">
                  Available Copies ({isLoadingCopies ? "..." : availableCopies?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews ({isLoadingReviews ? "..." : reviews?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="pt-6">
                {book.description ? (
                  <div className="prose max-w-none">
                    <p>{book.description}</p>
                  </div>
                ) : (
                  <p className="text-neutral-dark italic">No description available for this book.</p>
                )}
                
                {book.categories && book.categories.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((category, index) => (
                        <span key={index} className="bg-neutral-100 px-3 py-1 rounded-full text-sm">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="available" className="pt-6">
                {isLoadingCopies ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : availableCopies?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-dark mb-4">No copies available for exchange right now.</p>
                    <p className="mb-6">Add this book to your wishlist to get notified when it becomes available.</p>
                    <Button onClick={handleToggleFavorite} variant={isFavorited ? "default" : "outline"}>
                      <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                      {isFavorited ? "In Wishlist" : "Add to Wishlist"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableCopies?.map((copy) => (
                      <Card key={copy.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4 sm:p-6 flex-grow">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar>
                                  <AvatarImage src={copy.user.avatarUrl || ''} />
                                  <AvatarFallback>{copy.user.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">{copy.user.nickname}</h3>
                                  <p className="text-sm text-neutral-dark">
                                    Rating: {copy.user.averageRating > 0 
                                      ? `${copy.user.averageRating.toFixed(1)}/5.0 (${copy.user.totalRatings} ratings)` 
                                      : 'No ratings yet'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="text-sm">
                                  <span className="font-semibold">Condition:</span> {copy.condition.replace('_', ' ')}
                                </div>
                                {copy.conditionDescription && (
                                  <p className="text-sm mt-1">{copy.conditionDescription}</p>
                                )}
                              </div>
                              
                              {user && copy.user.id === user.id ? (
                                <p className="text-sm italic text-neutral-dark">This is your copy</p>
                              ) : (
                                <div className="flex gap-2">
                                  <Button onClick={() => proposeExchange(copy.id)}>
                                    Propose Exchange
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                  <Button variant="outline">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Contact Owner
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4 bg-neutral-50 flex flex-row sm:flex-col justify-between items-center sm:items-center sm:w-48">
                              <div className="text-center">
                                <div className="font-semibold text-2xl text-primary">{copy.creditAmount || 30}</div>
                                <div className="text-sm text-neutral-dark">Credits</div>
                              </div>
                              
                              <div className="text-center text-sm text-neutral-dark">
                                <div>Added</div>
                                <div>{new Date(copy.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="reviews" className="pt-6">
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold text-lg">
                        {reviews?.length 
                          ? `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}` 
                          : 'No reviews yet'}
                      </h3>
                      <WouterLink href={`/reviews/new?bookId=${bookId}`}>
                        <Button>Write a Review</Button>
                      </WouterLink>
                    </div>
                    
                    {reviews?.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-50 rounded-lg">
                        <p className="text-neutral-dark mb-4">Be the first to review this book!</p>
                        <WouterLink href={`/reviews/new?bookId=${bookId}`}>
                          <Button>Write a Review</Button>
                        </WouterLink>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {reviews?.map((review) => (
                          <div key={review.id} className="border-b pb-6 last:border-b-0">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar>
                                <AvatarImage src={review.user.avatarUrl || ''} />
                                <AvatarFallback>
                                  {review.user.nickname.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{review.user.nickname}</h4>
                                <div className="flex items-center text-neutral-dark text-sm">
                                  <StarRating rating={review.rating} size="small" className="mr-2" />
                                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-neutral-dark">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
