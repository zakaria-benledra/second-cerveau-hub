export function useHaptic() {
  const vibrate = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (!navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      success: [10, 50, 10],
      error: [50, 30, 50],
    };
    
    navigator.vibrate(patterns[pattern]);
  };
  
  return { vibrate };
}
