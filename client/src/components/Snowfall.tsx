import { useMemo } from 'react';

interface SnowflakeConfig {
  left: string;
  top: string;
  delay: string;
  duration: string;
  opacity: number;
  blur: number;
  size: number;
}

const SNOWFLAKE_COUNT = 40;

export default function Snowfall() {
  const flakes = useMemo<SnowflakeConfig[]>(() => {
    return Array.from({ length: SNOWFLAKE_COUNT }, () => {
      const left = `${-10 + Math.random() * 110}%`;
      const top = `${-40 - Math.random() * 20}vh`;
      const delay = `${Math.random() * 4}s`;
      const duration = `${10 + Math.random() * 5}s`;
      const opacity = Math.random() > 0.5 ? 0.3 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2;
      const hasBlur = Math.random() > 0.15;
      const blur = hasBlur ? 0.5 + Math.random() * 3.5 : 0;
      const isSmall = Math.random() < 0.7;
      const size = isSmall ? 8 + Math.random() * 12 : 30 + Math.random() * 30;
      return { left, top, delay, duration, opacity, blur, size };
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30" style={{ overflow: 'hidden' }}>
      {flakes.map((flake, index) => (
        <div
          key={index}
          className="snow"
          style={{
            left: flake.left,
            top: flake.top,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            opacity: flake.opacity,
            filter: flake.blur > 0 ? `blur(${flake.blur}px)` : 'none',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
          }}
        />
      ))}
    </div>
  );
}
