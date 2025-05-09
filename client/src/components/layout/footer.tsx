import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-darkest text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-white font-heading font-bold text-2xl">Liber<span className="text-accent-light">Mania</span></span>
            </Link>
            <p className="text-neutral-medium mb-4">The sustainable book exchange community that gives your books a second life.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-medium hover:text-white transition duration-150">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-medium hover:text-white transition duration-150">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-neutral-medium hover:text-white transition duration-150">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/books/available" className="text-neutral-medium hover:text-white transition duration-150">Browse Books</Link></li>
              <li><Link href="/books/available" className="text-neutral-medium hover:text-white transition duration-150">Latest Additions</Link></li>
              <li><Link href="/exchanges" className="text-neutral-medium hover:text-white transition duration-150">Popular Exchanges</Link></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Categories</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Community</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">How It Works</a></li>
              <li><Link href="/books/add" className="text-neutral-medium hover:text-white transition duration-150">Add Your Books</Link></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Credit System</a></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Safety Guidelines</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Help Center</a></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Contact Us</a></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-medium hover:text-white transition duration-150">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-dark pt-6 text-center text-neutral-medium text-sm">
          <p>&copy; {new Date().getFullYear()} LiberMania. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
