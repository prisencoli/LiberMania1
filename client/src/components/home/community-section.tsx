import { Users, MessageSquare, Star } from 'lucide-react';

export default function CommunitySection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-neutral-dark max-w-2xl mx-auto">Connect with book lovers, share recommendations, and build your personal library.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Community Feature 1 */}
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Connect with Readers</h3>
            <p className="text-neutral-dark">Find readers with similar tastes and exchange recommendations.</p>
          </div>
          
          {/* Community Feature 2 */}
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Direct Messaging</h3>
            <p className="text-neutral-dark">Chat directly with book owners to arrange exchanges safely.</p>
          </div>
          
          {/* Community Feature 3 */}
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Build Reputation</h3>
            <p className="text-neutral-dark">Earn ratings through successful exchanges and become a trusted member.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
