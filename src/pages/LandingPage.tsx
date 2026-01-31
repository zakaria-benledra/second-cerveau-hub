import {
  Header,
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  FeaturesSection,
  AIShowcaseSection,
  TransformationSection,
  PricingSection,
  TestimonialsSection,
  FinalCTASection,
  FooterSection
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <AIShowcaseSection />
      <TransformationSection />
      <PricingSection />
      <TestimonialsSection />
      <FinalCTASection />
      <FooterSection />
    </div>
  );
}
