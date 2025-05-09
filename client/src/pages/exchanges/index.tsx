import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Exchange, User, Book, UserBook, ExchangeStatus } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ArrowRightLeft, 
  Coins,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLocation } from 'wouter';

type ExtendedExchange = Exchange & {
  offerer: User;
  receiver: User;
  offeredUserBook?: UserBook & { book: Book };
  requestedUserBook: UserBook & { book: Book };
};

export default function ExchangesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('received');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExtendedExchange | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'cancel' | 'complete' | null>(null);
  
  // Fetch exchanges
  const { data: exchanges, isLoading, refetch } = useQuery<ExtendedExchange[]>({
    queryKey: [`/api/exchanges?type=${activeTab}`],
  });
  
  // Group exchanges by status
  const pendingExchanges = exchanges?.filter(exchange => exchange.status === 'PENDING') || [];
  const acceptedExchanges = exchanges?.filter(exchange => exchange.status === 'ACCEPTED') || [];
  const completedExchanges = exchanges?.filter(exchange => 
    exchange.status === 'COMPLETED' || exchange.status === 'REJECTED' || exchange.status === 'CANCELED'
  ) || [];
  
  // Handle exchange actions
  const handleExchangeAction = async () => {
    if (!selectedExchange || !actionType) return;
    
    try {
      await apiRequest('PATCH', `/api/exchanges/${selectedExchange.id}/${actionType}`);
      
      let message = '';
      switch (actionType) {
        case 'accept':
          message = 'Exchange accepted! You can now communicate with the other user to arrange the exchange.';
          break;
        case 'reject':
          message = 'Exchange rejected.';
          break;
        case 'cancel':
          message = 'Exchange canceled.';
          break;
        case 'complete':
          message = 'Exchange marked as completed! Credits have been transferred.';
          break;
      }
      
      toast({
        title: 'Success',
        description: message,
      });
      
      // Refetch exchanges to update the UI
      refetch();
    } catch (error) {
      console.error('Error performing exchange action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform action. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionDialogOpen(false);
      setSelectedExchange(null);
      setActionType(null);
    }
  };
  
  const openActionDialog = (exchange: ExtendedExchange, action: 'accept' | 'reject' | 'cancel' | 'complete') => {
    setSelectedExchange(exchange);
    setActionType(action);
    setActionDialogOpen(true);
  };
  
  const getStatusBadge = (status: ExchangeStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'CANCELED':
        return <Badge className="bg-neutral-500">Canceled</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return null;
    }
  };
  
  const renderExchangeCard = (exchange: ExtendedExchange) => {
    const isReceived = activeTab === 'received';
    const otherUser = isReceived ? exchange.offerer : exchange.receiver;
    const userBook = exchange.requestedUserBook;
    
    return (
      <Card key={exchange.id} className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={otherUser.avatarUrl || ''} />
                <AvatarFallback>{otherUser.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{isReceived ? 'Request from' : 'Request to'} {otherUser.nickname}</CardTitle>
                <CardDescription>
                  {new Date(exchange.createdAt).toLocaleDateString()} · {getStatusBadge(exchange.status)}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{isReceived ? 'They want:' : 'You want:'}</h3>
              <div className="flex bg-neutral-50 p-3 rounded-lg">
                <img 
                  src={userBook.book.coverImageUrl || `https://via.placeholder.com/80x120?text=${encodeURIComponent(userBook.book.title)}`}
                  alt={userBook.book.title}
                  className="w-16 h-24 object-cover rounded mr-3"
                />
                <div>
                  <h4 className="font-medium">{userBook.book.title}</h4>
                  <p className="text-sm text-neutral-dark">{userBook.book.author}</p>
                  <p className="text-xs text-neutral-dark mt-2">
                    Condition: {userBook.condition.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRightLeft className="h-8 w-8 text-neutral-dark" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{isReceived ? 'They offer:' : 'You offer:'}</h3>
              {exchange.offerType === 'BOOK' && exchange.offeredUserBook ? (
                <div className="flex bg-neutral-50 p-3 rounded-lg">
                  <img 
                    src={exchange.offeredUserBook.book.coverImageUrl || `https://via.placeholder.com/80x120?text=${encodeURIComponent(exchange.offeredUserBook.book.title)}`}
                    alt={exchange.offeredUserBook.book.title}
                    className="w-16 h-24 object-cover rounded mr-3"
                  />
                  <div>
                    <h4 className="font-medium">{exchange.offeredUserBook.book.title}</h4>
                    <p className="text-sm text-neutral-dark">{exchange.offeredUserBook.book.author}</p>
                    <p className="text-xs text-neutral-dark mt-2">
                      Condition: {exchange.offeredUserBook.condition.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 p-3 rounded-lg flex items-center">
                  <Coins className="h-6 w-6 text-secondary mr-3" />
                  <div>
                    <span className="text-xl font-semibold text-secondary-dark">{exchange.creditAmount}</span>
                    <span className="ml-1 text-neutral-dark">Credits</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {exchange.message && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm italic">"{exchange.message}"</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          {exchange.status === 'PENDING' && isReceived && (
            <>
              <Button 
                variant="outline" 
                onClick={() => openActionDialog(exchange, 'reject')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={() => openActionDialog(exchange, 'accept')}
                variant="default"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </>
          )}
          
          {exchange.status === 'PENDING' && !isReceived && (
            <Button 
              variant="outline" 
              onClick={() => openActionDialog(exchange, 'cancel')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Request
            </Button>
          )}
          
          {exchange.status === 'ACCEPTED' && (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate(`/chat/exchange/${exchange.id}`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Button>
              <Button 
                onClick={() => openActionDialog(exchange, 'complete')}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Completed
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>My Exchanges - LiberMania</title>
        <meta name="description" content="Manage your book exchanges on LiberMania. View received and sent exchange requests, chat with other users, and complete exchanges." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-3xl font-bold">My Exchanges</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : exchanges?.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-neutral-dark mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No exchanges found</h2>
            <p className="text-neutral-dark mb-6">
              {activeTab === 'received' 
                ? "You haven't received any exchange requests yet."
                : "You haven't sent any exchange requests yet."}
            </p>
            {activeTab === 'sent' && (
              <Button onClick={() => navigate('/books/available')}>Browse Available Books</Button>
            )}
          </div>
        ) : (
          <div>
            <Tabs defaultValue="pending">
              <TabsList className="mb-6">
                <TabsTrigger value="pending">
                  Pending ({pendingExchanges.length})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  Accepted ({acceptedExchanges.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed/Rejected ({completedExchanges.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {pendingExchanges.length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-dark">No pending exchanges.</p>
                  </div>
                ) : (
                  pendingExchanges.map(renderExchangeCard)
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {acceptedExchanges.length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-dark">No accepted exchanges.</p>
                  </div>
                ) : (
                  acceptedExchanges.map(renderExchangeCard)
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedExchanges.length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-dark">No completed or rejected exchanges.</p>
                  </div>
                ) : (
                  completedExchanges.map(renderExchangeCard)
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'accept' ? 'Accept this exchange?' :
               actionType === 'reject' ? 'Reject this exchange?' :
               actionType === 'cancel' ? 'Cancel this exchange request?' :
               actionType === 'complete' ? 'Complete this exchange?' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'accept' && "By accepting, you agree to exchange this book. The item will be marked as not available for other users."}
              {actionType === 'reject' && "The exchange will be rejected and the other user will be notified."}
              {actionType === 'cancel' && "Your exchange request will be canceled and the other user will be notified."}
              {actionType === 'complete' && (
                selectedExchange?.offerType === 'CREDITS' 
                  ? `This will mark the exchange as completed and transfer ${selectedExchange?.creditAmount} credits to the other user.` 
                  : "This will mark the exchange as completed. Both books will be marked as exchanged."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExchangeAction}>
              {actionType === 'accept' ? 'Accept' :
               actionType === 'reject' ? 'Reject' :
               actionType === 'cancel' ? 'Cancel Request' :
               actionType === 'complete' ? 'Complete Exchange' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
