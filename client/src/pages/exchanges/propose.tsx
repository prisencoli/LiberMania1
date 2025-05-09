import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProposeExchangeData, proposeExchangeSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Book as BookIcon, Coins } from 'lucide-react';

export default function ProposeExchangePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/exchanges/propose');
  const [offerType, setOfferType] = useState<'BOOK' | 'CREDITS'>('BOOK');
  
  // Get URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const requestedUserBookId = searchParams.get('requestedUserBookId');
  
  if (!requestedUserBookId) {
    navigate('/books/available');
    toast({
      title: 'Error',
      description: 'No book selected for exchange. Please choose a book first.',
      variant: 'destructive',
    });
  }
  
  // Fetch requested book details
  const { data: requestedUserBook, isLoading: isLoadingRequestedBook } = useQuery({
    queryKey: [`/api/user-books/${requestedUserBookId}`],
    enabled: !!requestedUserBookId,
  });
  
  // Fetch user's available books for exchange
  const { data: myAvailableBooks, isLoading: isLoadingMyBooks } = useQuery({
    queryKey: ['/api/books/my-collection/available'],
    enabled: !!user,
  });
  
  // Fetch user's wallet balance
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['/api/users/me/wallet'],
    enabled: !!user,
  });
  
  const form = useForm<ProposeExchangeData>({
    resolver: zodResolver(proposeExchangeSchema),
    defaultValues: {
      requestedUserBookId: parseInt(requestedUserBookId || '0'),
      offerType: 'BOOK',
      offeredUserBookId: undefined,
      creditAmount: 30,
      message: '',
    },
  });
  
  // Update form values when offer type changes
  useEffect(() => {
    form.setValue('offerType', offerType);
    if (offerType === 'CREDITS') {
      form.setValue('offeredUserBookId', undefined);
    } else {
      form.setValue('creditAmount', undefined);
    }
  }, [offerType, form]);
  
  // Propose exchange mutation
  const proposeExchangeMutation = useMutation({
    mutationFn: async (data: ProposeExchangeData) => {
      const response = await apiRequest('POST', '/api/exchanges', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchanges'] });
      toast({
        title: 'Exchange proposed',
        description: 'Your exchange proposal has been sent. You will be notified when the owner responds.',
      });
      navigate('/exchanges');
    },
    onError: (error: any) => {
      console.error('Error proposing exchange:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to propose exchange. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: ProposeExchangeData) => {
    proposeExchangeMutation.mutate(data);
  };
  
  if (isLoadingRequestedBook || !requestedUserBook) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Propose Exchange - LiberMania</title>
        <meta name="description" content="Propose a book exchange on LiberMania. Offer your book or credits in exchange for another book." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-8 text-center">Propose Exchange</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">You're requesting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <img 
                      src={requestedUserBook.book?.coverImageUrl || `https://via.placeholder.com/150x225?text=${encodeURIComponent(requestedUserBook.book?.title || 'Book')}`}
                      alt={requestedUserBook.book?.title}
                      className="w-28 h-40 object-cover rounded mb-3"
                    />
                    <h3 className="font-semibold text-center">{requestedUserBook.book?.title}</h3>
                    <p className="text-sm text-neutral-dark text-center">{requestedUserBook.book?.author}</p>
                    <div className="mt-2 text-center">
                      <Badge className="bg-neutral-500">
                        Condition: {requestedUserBook.condition?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-3 text-center text-sm">
                      <span className="font-semibold">Owner:</span> {requestedUserBook.user?.nickname}
                    </p>
                    {requestedUserBook.creditAmount && (
                      <div className="mt-3 flex items-center justify-center">
                        <Coins className="mr-1 h-4 w-4 text-secondary" />
                        <span className="font-semibold text-secondary">{requestedUserBook.creditAmount}</span>
                        <span className="ml-1 text-sm">Credits</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Offer</CardTitle>
                  <CardDescription>
                    Choose what you want to offer in exchange for this book.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="offerType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>What would you like to offer?</FormLabel>
                            <RadioGroup 
                              onValueChange={(value) => setOfferType(value as 'BOOK' | 'CREDITS')} 
                              defaultValue={offerType}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="BOOK" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <BookIcon className="mr-2 h-4 w-4" />
                                  One of my books
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="CREDITS" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Coins className="mr-2 h-4 w-4" />
                                  Credits
                                  {walletData && (
                                    <Badge variant="outline" className="ml-2">
                                      Balance: {walletData.balance} credits
                                    </Badge>
                                  )}
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormItem>
                        )}
                      />
                      
                      <Tabs value={offerType} onValueChange={(v) => setOfferType(v as 'BOOK' | 'CREDITS')}>
                        <TabsContent value="BOOK" className="space-y-4">
                          {isLoadingMyBooks ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : !myAvailableBooks || myAvailableBooks.length === 0 ? (
                            <div className="bg-neutral-50 p-4 rounded-lg text-center">
                              <p className="mb-2">You don't have any available books to exchange.</p>
                              <Button onClick={() => navigate('/books/add')} variant="outline" size="sm">
                                Add a book
                              </Button>
                            </div>
                          ) : (
                            <FormField
                              control={form.control}
                              name="offeredUserBookId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select a book to offer</FormLabel>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {myAvailableBooks.map((userBook) => (
                                      <div 
                                        key={userBook.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                          field.value === userBook.id ? 'border-primary bg-primary-50' : 'hover:border-neutral-400'
                                        }`}
                                        onClick={() => field.onChange(userBook.id)}
                                      >
                                        <div className="flex items-start space-x-3">
                                          <img 
                                            src={userBook.book?.coverImageUrl || `https://via.placeholder.com/60x90?text=${encodeURIComponent(userBook.book?.title || 'Book')}`}
                                            alt={userBook.book?.title}
                                            className="w-14 h-20 object-cover rounded"
                                          />
                                          <div>
                                            <h4 className="font-medium line-clamp-2">{userBook.book?.title}</h4>
                                            <p className="text-xs text-neutral-dark">{userBook.book?.author}</p>
                                            <Badge className="mt-1 text-xs" variant="outline">
                                              {userBook.condition?.replace('_', ' ')}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </TabsContent>
                        
                        <TabsContent value="CREDITS" className="space-y-4">
                          <FormField
                            control={form.control}
                            name="creditAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  {walletData && (
                                    <span>Your balance: <span className="font-semibold">{walletData.balance} credits</span></span>
                                  )}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Send a message to the book owner..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Be polite and friendly. You can include details about meeting arrangements or ask questions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="px-0 pb-0 pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={
                            proposeExchangeMutation.isPending || 
                            !form.formState.isValid || 
                            (offerType === 'BOOK' && !form.getValues('offeredUserBookId')) ||
                            (offerType === 'CREDITS' && (!form.getValues('creditAmount') || (walletData && form.getValues('creditAmount')! > walletData.balance)))
                          }
                        >
                          {proposeExchangeMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send Proposal'
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}