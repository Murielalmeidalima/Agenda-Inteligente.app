'use client';

import { HeroSection } from './sections/HeroSection';
import { FounderSection } from './sections/FounderSection';
import { PainPointsSection } from './sections/PainPointsSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { GallerySection } from './sections/GallerySection';
import { BenefitsSection } from './sections/BenefitsSection';
import { ComparisonSection } from './sections/ComparisonSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { PricingSection } from './sections/PricingSection';
import { FAQSection } from './sections/FAQSection';
import { CTASection } from './sections/CTASection';
import { FooterSection } from './sections/FooterSection';
import { PublicNavbar } from './PublicNavbar';
import Link from 'next/link';
import { Button } from '@projeto/ui';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2825] transition-colors duration-300 scroll-smooth">
      {/* Navigation Navbar */}
      <PublicNavbar />

      <main>
        <HeroSection />
        <FounderSection />
        <PainPointsSection />
        <FeaturesSection />
        <GallerySection />
        <BenefitsSection />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}
