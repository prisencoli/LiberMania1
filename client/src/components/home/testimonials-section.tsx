import StarRating from '@/components/ui/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Testimonial data
const testimonials = [
  {
    id: 1,
    quote: "LiberMania has transformed how I read. I've discovered amazing books I'd never have found otherwise, and my shelves aren't overflowing anymore!",
    name: "Sofia G.",
    memberSince: "2022",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    rating: 5
  },
  {
    id: 2,
    quote: "I love the credit system! It makes exchanges so flexible. And I've met the most amazing fellow book lovers through the platform.",
    name: "Marco T.",
    memberSince: "2021",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    rating: 5
  },
  {
    id: 3,
    quote: "As a student, buying new books was getting expensive. With LiberMania, I can read more while spending less. The interface is super intuitive too!",
    name: "Alex K.",
    memberSince: "2023",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    rating: 4
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">What Our Members Say</h2>
          <p className="text-neutral-dark max-w-2xl mx-auto">Hear from readers who've found their next favorite book through LiberMania.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className={`bg-white p-6 rounded-xl shadow ${
              index === 2 && testimonials.length === 3 ? 'md:col-span-2 lg:col-span-1' : ''
            }`}>
              <div className="mb-4">
                <StarRating rating={testimonial.rating} />
              </div>
              <blockquote className="font-accent italic mb-6">{testimonial.quote}</blockquote>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-neutral-dark">Member since {testimonial.memberSince}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
