import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function CtaSection() {
  const { user } = useAuth();
  
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Ready to Start Exchanging?</h2>
        <p className="text-xl max-w-xl mx-auto mb-8 opacity-90">
          {user 
            ? "Start adding books to your collection and earn credits for every book!" 
            : "Join our community today and get 50 bonus credits to kickstart your reading journey!"}
        </p>
        
        {user ? (
          <Link href="/books/add">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-light rounded-full text-lg font-bold">
              Add Your First Book
            </Button>
          </Link>
        ) : (
          <Link href="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-light rounded-full text-lg font-bold">
              Sign Up Now
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
