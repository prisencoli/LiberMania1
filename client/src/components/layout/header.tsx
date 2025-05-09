import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Bell, Menu, LogOut, User as UserIcon, Book, BarChart2, Heart, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Get unread notifications count
  const { data: notifications } = useQuery<{read: boolean}[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-primary font-heading font-bold text-2xl">Liber<span className="text-accent-light">Mania</span></span>
        </Link>
        
        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-6">
          <div className="relative w-full">
            <Input 
              type="text" 
              placeholder="Search books by title, author, or ISBN" 
              className="w-full px-4 py-2 pl-10 rounded-full"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-dark" />
          </div>
        </div>
        
        {/* Desktop Nav */}
        {user ? (
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/books/available" className="text-neutral-darkest hover:text-primary font-medium transition duration-150">
              Browse
            </Link>
            <Link href="/books/my-collection" className="text-neutral-darkest hover:text-primary font-medium transition duration-150">
              My Books
            </Link>
            <Link href="/exchanges" className="text-neutral-darkest hover:text-primary font-medium transition duration-150">
              Exchanges
            </Link>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-light text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-auto">
                  {/* Notification items would go here */}
                  <div className="py-2 px-3 text-sm text-neutral-dark">
                    No new notifications
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button size="sm" variant="outline" className="w-full">
                    View All
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Credit Balance */}
            <div className="flex items-center bg-secondary-light rounded-full px-3 py-1.5">
              <CreditCard className="h-5 w-5 text-secondary-dark" />
              <span className="font-bold ml-1.5 text-secondary-dark">{user.credits}</span>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.nickname} />
                    <AvatarFallback>{user.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.nickname}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/books/my-collection')}>
                    <Book className="mr-2 h-4 w-4" />
                    <span>My Collection</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-activity/favorites')}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Wishlist</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/credits/purchase')}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>Buy Credits</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        )}
        
        {/* Mobile Nav Icons */}
        <div className="flex md:hidden items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleMobileSearch}>
            <Search className="h-6 w-6" />
          </Button>
          {user && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-light text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Search (Hidden by default) */}
      {showMobileSearch && (
        <div className="md:hidden">
          <div className="px-4 py-3">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search books by title, author, or ISBN" 
                className="w-full px-4 py-2 pl-10 rounded-full"
              />
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-dark" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
