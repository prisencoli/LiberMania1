import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Book, UserBook, UserBookStatus } from '@shared/schema';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen, 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AddBookModal from '@/components/books/add-book-modal';

type ExtendedUserBook = UserBook & { book: Book };

export default function MyCollectionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<ExtendedUserBook | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch user's books
  const { data: books, isLoading } = useQuery<ExtendedUserBook[]>({
    queryKey: ['/api/books/my-collection'],
    enabled: true,
  });
  
  // Filter books by status for tabs
  const availableBooks = books?.filter(book => book.status === 'AVAILABLE') || [];
  const notAvailableBooks = books?.filter(book => book.status === 'NOT_AVAILABLE') || [];
  const exchangedBooks = books?.filter(book => book.status === 'EXCHANGED') || [];
  
  // Mutation to update book status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: UserBookStatus }) => {
      await apiRequest('PATCH', `/api/books/my-collection/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/books/my-collection'] });
      toast({
        title: 'Book updated',
        description: 'Book status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update book status. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to delete book
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/books/my-collection/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/books/my-collection'] });
      toast({
        title: 'Book removed',
        description: 'Book has been removed from your collection.',
      });
      setBookToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove book. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleToggleAvailability = (book: ExtendedUserBook) => {
    const newStatus = book.status === 'AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE';
    updateStatusMutation.mutate({ id: book.id, status: newStatus });
  };
  
  const handleDeleteBook = (book: ExtendedUserBook) => {
    setBookToDelete(book);
  };
  
  const confirmDeleteBook = () => {
    if (bookToDelete) {
      deleteBookMutation.mutate(bookToDelete.id);
    }
  };
  
  const renderBookCard = (book: ExtendedUserBook) => (
    <Card key={book.id} className="h-full flex flex-col">
      <div className="relative">
        <img 
          src={book.book.coverImageUrl || `https://via.placeholder.com/200x300?text=${encodeURIComponent(book.book.title)}`}
          alt={`${book.book.title} by ${book.book.author}`}
          className="w-full aspect-[2/3] object-cover rounded-t-lg"
        />
        <Badge className={`absolute top-2 right-2 ${
          book.status === 'AVAILABLE' ? 'bg-green-500' :
          book.status === 'EXCHANGED' ? 'bg-orange-500' : 'bg-neutral-500'
        }`}>
          {book.status === 'AVAILABLE' ? 'Available' :
           book.status === 'EXCHANGED' ? 'Exchanged' : 'Not Available'}
        </Badge>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-heading font-bold text-base mb-1 line-clamp-2" title={book.book.title}>
          {book.book.title}
        </h3>
        <p className="text-neutral-dark text-sm mb-2">{book.book.author}</p>
        <p className="text-xs text-neutral-dark mb-4">
          Condition: {book.condition.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
        </p>
        
        <div className="mt-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/books/info/${book.book.id}`)}
          >
            View
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/books/edit/${book.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              
              {book.status !== 'EXCHANGED' && (
                <DropdownMenuItem onClick={() => handleToggleAvailability(book)}>
                  {book.status === 'AVAILABLE' ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      <span>Make Unavailable</span>
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Make Available</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => handleDeleteBook(book)}>
                <Trash className="mr-2 h-4 w-4" />
                <span>Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <>
      <Helmet>
        <title>My Book Collection - LiberMania</title>
        <meta name="description" content="Manage your book collection on LiberMania. Add, edit, and share books from your library." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">My Book Collection</h1>
          
          <Button 
            onClick={() => setIsAddBookModalOpen(true)}
            className="mt-4 md:mt-0"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Book
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">
              All ({books?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({availableBooks.length || 0})
            </TabsTrigger>
            <TabsTrigger value="not-available">
              Not Available ({notAvailableBooks.length || 0})
            </TabsTrigger>
            <TabsTrigger value="exchanged">
              Exchanged ({exchangedBooks.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
          ) : books?.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="mx-auto h-16 w-16 text-neutral-medium mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your collection is empty</h2>
              <p className="text-neutral-dark mb-8">Start adding books to your collection to earn credits and make exchanges.</p>
              <Button onClick={() => setIsAddBookModalOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Your First Book
              </Button>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {books?.map(renderBookCard)}
                </div>
              </TabsContent>
              
              <TabsContent value="available" className="mt-0">
                {availableBooks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-dark mb-4">You don't have any books available for exchange.</p>
                    <Button variant="outline" onClick={() => setActiveTab('not-available')}>
                      Make a book available
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {availableBooks.map(renderBookCard)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="not-available" className="mt-0">
                {notAvailableBooks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-dark">You don't have any books that are not available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {notAvailableBooks.map(renderBookCard)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="exchanged" className="mt-0">
                {exchangedBooks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-dark mb-4">You haven't exchanged any books yet.</p>
                    <Link href="/books/available">
                      <Button>Browse available books</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {exchangedBooks.map(renderBookCard)}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      
      {/* Add Book Modal */}
      <AddBookModal 
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{bookToDelete?.book.title}" from your collection. This action cannot be undone.
              {bookToDelete?.status === 'AVAILABLE' && " The book will no longer be available for exchange."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBook} className="bg-red-500 hover:bg-red-600">
              {deleteBookMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
