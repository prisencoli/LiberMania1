import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AddBookByIsbnData, addBookByIsbnSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useLocation } from 'wouter';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const extendedSchema = addBookByIsbnSchema.extend({
  makeAvailable: z.boolean().optional(),
});

type FormData = z.infer<typeof extendedSchema>;

export default function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      form.setValue('isbn', '9780141187761');
    }, 2000);
  };
  
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
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
      
      // Close modal and reset form
      onClose();
      form.reset();
      
      // Redirect to my collection page
      navigate('/books/my-collection');
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Add Book to Your Collection</DialogTitle>
          <DialogDescription>
            Enter the ISBN of the book you want to add to your collection.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter ISBN</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        placeholder="e.g. 9780141187761"
                        {...field}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={handleScanIsbn}
                      disabled={isScanning}
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make available for exchange</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add to Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
