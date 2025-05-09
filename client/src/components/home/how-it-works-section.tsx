import { PlusCircle, Search, ArrowLeftRight } from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">How LiberMania Works</h2>
          <p className="text-neutral-dark max-w-2xl mx-auto">Our virtual credit system makes exchanging books flexible and rewarding.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-neutral-light rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Add Your Books</h3>
            <p className="text-neutral-dark">List books you want to share. Each book added to your collection earns you credits.</p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-neutral-light rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Browse & Request</h3>
            <p className="text-neutral-dark">Find books you want to read. Propose exchanges using your books or credits.</p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-neutral-light rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Exchange & Enjoy</h3>
            <p className="text-neutral-dark">Coordinate with other members, exchange books, and earn community reputation.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
