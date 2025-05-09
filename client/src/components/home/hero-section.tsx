import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="bg-neutral-darkest text-white py-12 md:py-20 relative overflow-hidden">
      {/* Decorative Book Pattern Background */}
      <div className="absolute inset-0 opacity-10 bg-repeat bg-[length:60px_60px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect x='0' y='0' width='10' height='60' fill='%23ffffff' /%3E%3Crect x='10' y='0' width='10' height='60' fill='%23f8f8f8' /%3E%3Crect x='20' y='0' width='10' height='60' fill='%23ffffff' /%3E%3Crect x='30' y='0' width='10' height='60' fill='%23f8f8f8' /%3E%3Crect x='40' y='0' width='10' height='60' fill='%23ffffff' /%3E%3Crect x='50' y='0' width='10' height='60' fill='%23f8f8f8' /%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Exchange Books, <br/>Share Stories</h1>
            <p className="text-lg mb-6 opacity-90">Join the sustainable book-sharing community where your old books find new readers and you discover your next favorite read.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <>
                  <Link href="/books/available">
                    <Button size="lg" className="bg-accent hover:bg-accent-dark text-white font-bold rounded-full">
                      Browse Books
                    </Button>
                  </Link>
                  <Link href="/books/add">
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-neutral-darkest rounded-full">
                      Add Your Books
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button size="lg" className="bg-accent hover:bg-accent-dark text-white font-bold rounded-full">
                      Get Started
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-neutral-darkest rounded-full">
                    How It Works
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1526243741027-444d633d7365?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=500" 
                alt="Stack of colorful books" 
                className="rounded-lg shadow-lg"
              />
              
              <div className="absolute -bottom-4 -left-4 bg-primary text-white p-3 rounded-lg shadow-lg">
                <div className="text-xl font-bold">500+</div>
                <div className="text-sm">Books Exchanged</div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-secondary text-secondary-dark p-3 rounded-lg shadow-lg">
                <div className="text-xl font-bold">320+</div>
                <div className="text-sm">Active Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
