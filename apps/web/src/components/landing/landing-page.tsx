'use client';

import { PublicNavbar } from './PublicNavbar';
import { HeroSection } from './sections/HeroSection';
import { FounderSection } from './sections/FounderSection';
import { SystemShowcaseSection } from './sections/SystemShowcaseSection';
import { BenefitsSection } from './sections/BenefitsSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { PricingSection } from './sections/PricingSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FAQSection } from './sections/FAQSection';
import { CTASection } from './sections/CTASection';
import { FooterSection } from './sections/FooterSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#2C2825] transition-colors duration-300 scroll-smooth">
      {/* Navigation Navbar */}
      <PublicNavbar />

      <main>
        <HeroSection />
        <FounderSection />
        <SystemShowcaseSection />
        <BenefitsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <IntegrationsSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}

