import { Home, Search, PlusCircle, BarChart2, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import AddBookModal from '@/components/books/add-book-modal';

export default function MobileNavigation() {
  const [location] = useLocation();
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  
  // Check if current location matches the navigation item
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-medium flex justify-around items-center z-30">
        <Link href="/" className={`flex flex-col items-center py-2 px-4 ${isActive('/') ? 'text-primary' : 'text-neutral-dark'}`}>
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link href="/books/available" className={`flex flex-col items-center py-2 px-4 ${isActive('/books/available') ? 'text-primary' : 'text-neutral-dark'}`}>
          <Search className="h-6 w-6" />
          <span className="text-xs mt-1">Browse</span>
        </Link>
        
        <button 
          onClick={() => setIsAddBookModalOpen(true)}
          className="flex flex-col items-center py-2 px-4 text-accent-light"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs mt-1">Add Book</span>
        </button>
        
        <Link href="/exchanges" className={`flex flex-col items-center py-2 px-4 ${isActive('/exchanges') ? 'text-primary' : 'text-neutral-dark'}`}>
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs mt-1">Exchanges</span>
        </Link>
        
        <Link href="/profile" className={`flex flex-col items-center py-2 px-4 ${isActive('/profile') ? 'text-primary' : 'text-neutral-dark'}`}>
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
      
      <AddBookModal 
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
      />
    </>
  );
}
