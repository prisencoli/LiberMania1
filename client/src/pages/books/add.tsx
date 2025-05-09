import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { AddBookByIsbnData, addBookByIsbnSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const extendedSchema = addBookByIsbnSchema.extend({
  makeAvailable: z.boolean().optional(),
});

type FormData = z.infer<typeof extendedSchema>;

export default function AddBookPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      isbn: '',
      condition: '',
      conditionDescription: '',
      makeAvailable: true,
    }
  });
  
  const handleScanIsbn = () => {
    setIsScanning(true);
    // In a real implementation, we would use a barcode scanner library
    // For now, we'll just simulate scanning
    setTimeout(() => {
      setIsScanning(false);
      // Example ISBN
      const isbn = '9780141187761';
      form.setValue('isbn', isbn);
      fetchBookDetails(isbn);
    }, 2000);
  };
  
  const fetchBookDetails = async (isbn: string) => {
    try {
      setIsLoadingBook(true);
      const response = await fetch(`/api/books/isbn/${isbn}`);
      if (!response.ok) {
        throw new Error('Book not found');
      }
      const data = await response.json();
      setBook(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not find book details. Please check the ISBN or try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBook(false);
    }
  };
  
  const onSubmit = async (data: FormData) => {
    try {
      // Call API to add book to collection
      const submissionData: AddBookByIsbnData = {
        isbn: data.isbn,
        condition: data.condition,
        conditionDescription: data.conditionDescription,
      };
      
      const response = await apiRequest('POST', '/api/books/my-collection', submissionData);
      const userBook = await response.json();
      
      // If user wants to make book available for exchange, update it
      if (data.makeAvailable) {
        await apiRequest('PATCH', `/api/books/my-collection/${userBook.id}`, {
          status: 'AVAILABLE'
        });
      }
      
      // Invalidate queries to reflect changes
      queryClient.invalidateQueries({ queryKey: ['/api/books/my-collection'] });
      
      toast({
        title: 'Book added',
        description: `${data.makeAvailable ? 'Your book is now available for exchange!' : 'Book added to your collection.'}`,
      });
      
      // Redirect to my collection page
      navigate('/books/my-collection');
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const isbnValue = form.watch('isbn');
  
  return (
    <>
      <Helmet>
        <title>Add Book to Collection - LiberMania</title>
        <meta name="description" content="Add a book to your collection on LiberMania. Share books with the community and earn credits." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-8 text-center">Add Book to Your Collection</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Enter Book Details</CardTitle>
              <CardDescription>
                Provide the ISBN of the book you want to add to your collection. We'll fetch the book details automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isbn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISBN Number</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input
                                placeholder="e.g. 9780141187761"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setBook(null);
                                }}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={handleScanIsbn}
                              disabled={isScanning}
                            >
                              {isScanning ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                            </Button>
                            <Button 
                              type="button"
                              onClick={() => fetchBookDetails(isbnValue)}
                              disabled={!isbnValue || isLoadingBook}
                            >
                              {isLoadingBook ? "Loading..." : "Lookup"}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {book && (
                      <div className="bg-neutral-50 p-4 rounded-md border mb-4">
                        <div className="flex items-start gap-4">
                          {book.coverImageUrl && (
                            <img 
                              src={book.coverImageUrl} 
                              alt={book.title} 
                              className="w-20 h-auto rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{book.title}</h3>
                            <p className="text-neutral-dark">{book.author}</p>
                            {book.publishedYear && <p className="text-sm text-neutral-dark">Published: {book.publishedYear}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Book Condition</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="like_new">Like New</SelectItem>
                              <SelectItem value="very_good">Very Good</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="acceptable">Acceptable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="conditionDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe any specific marks, highlights, or details about your book."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="makeAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Make available for exchange</FormLabel>
                            <p className="text-sm text-neutral-dark">
                              Other users will be able to request this book for exchange.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <CardFooter className="px-0 pb-0 pt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/books/my-collection')}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!book || !form.formState.isValid}>
                      Add to Collection
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
