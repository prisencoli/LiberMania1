import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, Exchange, ExchangeMessage } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCheck,
  Loader2,
  MessageSquare,
  ArrowRightLeft
} from 'lucide-react';

type ExtendedExchange = Exchange & {
  offerer: User;
  receiver: User;
  offeredUserBook?: {
    id: number;
    book: {
      title: string;
      author: string;
      coverImageUrl?: string;
    }
  };
  requestedUserBook: {
    id: number;
    book: {
      title: string;
      author: string;
      coverImageUrl?: string;
    }
  };
};

type ExtendedExchangeMessage = ExchangeMessage & {
  sender: User;
};

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(500, 'Message is too long'),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function ExchangeChatPage() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Fetch exchange details
  const { data: exchange, isLoading: isLoadingExchange } = useQuery<ExtendedExchange>({
    queryKey: [`/api/exchanges/${exchangeId}`],
  });
  
  // Fetch messages
  const { 
    data: messages, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery<ExtendedExchangeMessage[]>({
    queryKey: [`/api/exchanges/${exchangeId}/messages`],
  });
  
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  });
  
  // WebSocket connection
  useEffect(() => {
    if (!user || !exchangeId) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join exchange room
      ws.send(JSON.stringify({
        type: 'join',
        room: `exchange:${exchangeId}`,
        userId: user.id
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.exchangeId === parseInt(exchangeId)) {
          // Refetch messages when a new message arrives
          refetchMessages();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setSocket(ws);
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        // Leave exchange room
        ws.send(JSON.stringify({
          type: 'leave',
          room: `exchange:${exchangeId}`,
          userId: user.id
        }));
        ws.close();
      }
    };
  }, [user, exchangeId, refetchMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/exchanges/${exchangeId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      refetchMessages();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: MessageFormData) => {
    if (!user) return;
    sendMessageMutation.mutate(data.content);
  };
  
  if (isLoadingExchange || !exchange) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const otherUser = user?.id === exchange.offererId ? exchange.receiver : exchange.offerer;
  
  return (
    <>
      <Helmet>
        <title>Exchange Chat - LiberMania</title>
        <meta name="description" content="Chat with another user about your book exchange on LiberMania." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/exchanges')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exchanges
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              {/* Exchange Info Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Chat with {otherUser.nickname}
                  </CardTitle>
                  <CardDescription>
                    Exchange Status: {getStatusBadge(exchange.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage src={otherUser.avatarUrl || ''} />
                      <AvatarFallback>{otherUser.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{otherUser.nickname}</h3>
                    {otherUser.averageRating > 0 && (
                      <p className="text-sm text-neutral-dark">
                        Rating: {otherUser.averageRating.toFixed(1)}/5.0 ({otherUser.totalRatings})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Exchange Details Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ArrowRightLeft className="mr-2 h-5 w-5" />
                    Exchange Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {user?.id === exchange.receiverId ? 'Your book' : `${exchange.receiver.nickname}'s book`}:
                    </h4>
                    <div className="flex bg-neutral-50 p-2 rounded-lg">
                      <img 
                        src={exchange.requestedUserBook.book.coverImageUrl || `https://via.placeholder.com/60x90?text=${encodeURIComponent(exchange.requestedUserBook.book.title)}`}
                        alt={exchange.requestedUserBook.book.title}
                        className="w-12 h-16 object-cover rounded mr-2"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{exchange.requestedUserBook.book.title}</p>
                        <p className="text-neutral-dark">{exchange.requestedUserBook.book.author}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {user?.id === exchange.offererId ? 'Your offer' : `${exchange.offerer.nickname}'s offer`}:
                    </h4>
                    {exchange.offerType === 'BOOK' && exchange.offeredUserBook ? (
                      <div className="flex bg-neutral-50 p-2 rounded-lg">
                        <img 
                          src={exchange.offeredUserBook.book.coverImageUrl || `https://via.placeholder.com/60x90?text=${encodeURIComponent(exchange.offeredUserBook.book.title)}`}
                          alt={exchange.offeredUserBook.book.title}
                          className="w-12 h-16 object-cover rounded mr-2"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{exchange.offeredUserBook.book.title}</p>
                          <p className="text-neutral-dark">{exchange.offeredUserBook.book.author}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-neutral-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-semibold text-secondary-dark">{exchange.creditAmount} Credits</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto" style={{ maxHeight: '500px' }}>
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="text-center py-16 text-neutral-dark">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {messages?.map((message) => (
                        <div 
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.senderId === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-neutral-100 text-neutral-dark'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <span className="text-xs font-medium">
                                {message.senderId === user?.id ? 'You' : message.sender.nickname}
                              </span>
                              <span className="text-xs ml-auto opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p>{message.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>
                
                {exchange.status === 'ACCEPTED' && (
                  <CardFooter className="border-t p-3">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Type your message..."
                          className="flex-grow resize-none h-12 py-3"
                          maxLength={500}
                          {...form.register('content')}
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={sendMessageMutation.isPending || !form.formState.isValid}
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {form.formState.errors.content && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.content.message}
                        </p>
                      )}
                    </form>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getStatusBadge(status: string) {
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
}