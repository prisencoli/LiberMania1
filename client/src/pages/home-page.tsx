import { Helmet } from 'react-helmet';
import HeroSection from '@/components/home/hero-section';
import HowItWorksSection from '@/components/home/how-it-works-section';
import FeaturedBooksSection from '@/components/home/featured-books-section';
import CommunitySection from '@/components/home/community-section';
import TestimonialsSection from '@/components/home/testimonials-section';
import CtaSection from '@/components/home/cta-section';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>LiberMania - Book Exchange Community</title>
        <meta name="description" content="Join the sustainable book-sharing community where your old books find new readers and you discover your next favorite read." />
      </Helmet>
      
      <HeroSection />
      <HowItWorksSection />
      <FeaturedBooksSection />
      <CommunitySection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
