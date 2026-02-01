import { Player } from '@lottiefiles/react-lottie-player';

// URLs d'animations gratuites depuis lottiefiles.com
const animations = {
  success: 'https://assets5.lottiefiles.com/packages/lf20_jbrw3hcz.json',
  empty: 'https://assets5.lottiefiles.com/packages/lf20_ysrn2iwp.json',
  loading: 'https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json',
  celebration: 'https://assets10.lottiefiles.com/packages/lf20_touohxv0.json',
};

interface LottieStateProps {
  type: keyof typeof animations;
  size?: number;
  loop?: boolean;
}

export function LottieState({ type, size = 200, loop = true }: LottieStateProps) {
  return (
    <Player
      autoplay
      loop={loop}
      src={animations[type]}
      style={{ height: size, width: size }}
    />
  );
}
