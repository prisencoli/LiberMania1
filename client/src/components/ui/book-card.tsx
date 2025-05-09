import { Link } from 'wouter';
import { Book, UserBook } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from '@/components/ui/star-rating';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface BookCardProps {
  userBook: UserBook & { book: Book, user: { nickname: string } };
  showCredits?: boolean;
  showRating?: boolean;
  onClick?: () => void;
}

export default function BookCard({ userBook, showCredits = true, showRating = true, onClick }: BookCardProps) {
  const { user } = useAuth();
  const { book } = userBook;
  
  // Track boost click if book is boosted
  const handleClick = async () => {
    if (userBook.boostActive) {
      try {
        await apiRequest('POST', `/api/books/user-book/${userBook.id}/boost-click`);
      } catch (error) {
        console.error('Failed to track boost click', error);
      }
    }
    if (onClick) onClick();
  };
  
  // Determine if this book is in the user's collection
  const isOwnBook = user && userBook.userId === user.id;
  
  return (
    <Link href={`/books/info/${book.id}`} onClick={handleClick}>
      <Card className="book-card h-full bg-white rounded-lg shadow-md overflow-hidden transition duration-200 hover:shadow-lg transform hover:-translate-y-1">
        <div className="relative">
          <img 
            src={book.coverImageUrl || `https://via.placeholder.com/200x300?text=${encodeURIComponent(book.title)}`}
            alt={`${book.title} by ${book.author}`}
            className="w-full aspect-[2/3] object-cover"
          />
          {showCredits && (
            <div className="absolute top-2 right-2 bg-secondary text-secondary-dark text-xs font-bold px-2 py-1 rounded">
              {isOwnBook ? 'Your Book' : `${userBook.creditAmount || 30} credits`}
            </div>
          )}
          {userBook.boostActive && (
            <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-heading font-bold text-sm leading-tight mb-1" title={book.title}>
            {book.title.length > 40 ? `${book.title.substring(0, 40)}...` : book.title}
          </h3>
          <p className="text-neutral-dark text-xs mb-2">{book.author}</p>
          {showRating && (
            <div className="flex items-center text-xs">
              <StarRating rating={4} size="small" className="mr-1" />
              <span className="text-neutral-dark">(42)</span>
            </div>
          )}
          <p className="text-xs text-neutral-dark mt-1">Owner: {userBook.user.nickname}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
