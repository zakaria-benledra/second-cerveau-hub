import { useState, useEffect } from 'react';
import { useShouldShowOnboarding } from '@/hooks/useOnboarding';
import { TransformationWizard } from './TransformationWizard';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { shouldShow, isLoading } = useShouldShowOnboarding();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!isLoading && shouldShow) {
      // Small delay to prevent flash on fast loads
      const timer = setTimeout(() => setShowWizard(true), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isLoading]);

  const handleComplete = () => {
    setShowWizard(false);
  };

  return (
    <>
      {children}
      {showWizard && <TransformationWizard onComplete={handleComplete} />}
    </>
  );
}
