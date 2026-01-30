import { cn } from '@/lib/utils';

interface ScoreRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: { ring: 64, stroke: 6, text: 'text-lg', label: 'text-[10px]' },
  md: { ring: 80, stroke: 7, text: 'text-2xl', label: 'text-xs' },
  lg: { ring: 100, stroke: 8, text: 'text-3xl', label: 'text-sm' },
  xl: { ring: 140, stroke: 10, text: 'text-4xl', label: 'text-base' },
};

function getScoreColor(value: number): string {
  if (value >= 80) return 'hsl(155, 75%, 48%)'; // success
  if (value >= 60) return 'hsl(262, 85%, 62%)'; // primary
  if (value >= 40) return 'hsl(40, 95%, 55%)'; // warning
  return 'hsl(0, 65%, 55%)'; // destructive
}

function getScoreGlow(value: number): string {
  if (value >= 80) return 'glow-success';
  if (value >= 60) return 'glow';
  return '';
}

export function ScoreRing({ 
  value, 
  max = 100, 
  size = 'md', 
  label, 
  sublabel,
  onClick,
  className 
}: ScoreRingProps) {
  const config = sizeMap[size];
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;
  
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const color = getScoreColor(percentage);
  const glowClass = getScoreGlow(percentage);

  return (
    <div 
      className={cn(
        'relative flex flex-col items-center justify-center',
        onClick && 'cursor-pointer hover:scale-105 transition-transform duration-200',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg
        width={config.ring}
        height={config.ring}
        className={cn('transform -rotate-90', glowClass)}
      >
        {/* Background circle */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={config.stroke}
          className="opacity-30"
        />
        {/* Progress circle */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={cn(
            'font-bold tabular-nums',
            config.text,
            onClick && 'clickable-stat'
          )}
          style={{ color }}
        >
          {Math.round(normalizedValue)}
        </span>
        {label && (
          <span className={cn('text-muted-foreground font-medium', config.label)}>
            {label}
          </span>
        )}
      </div>
      
      {sublabel && (
        <span className="mt-2 text-xs text-muted-foreground text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
}
