'use client';

import { HeroSection } from './sections/HeroSection';
import { PainPointsSection } from './sections/PainPointsSection';
import { FounderSection } from './sections/FounderSection';
import { VideoSection } from './sections/VideoSection';
import { GallerySection } from './sections/GallerySection';
import { SecuritySection } from './sections/SecuritySection';
import { PricingSection } from './sections/PricingSection';
import { FAQSection } from './sections/FAQSection';
import { CTASection } from './sections/CTASection';
import { FooterSection } from './sections/FooterSection';
import { PublicNavbar } from './PublicNavbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#1f1a1b] transition-colors duration-300 scroll-smooth">
      {/* Navigation Navbar */}
      <PublicNavbar />

      <main>
        <HeroSection />
        <PainPointsSection />
        <FounderSection />
        <VideoSection />
        <GallerySection />
        <SecuritySection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}

