import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show nothing while checking auth or if user is logged in (will redirect)
  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
