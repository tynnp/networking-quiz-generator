import { useMemo } from 'react';

interface SnowflakeConfig {
  left: string;
  delay: string;
  duration: string;
  opacity: number;
  size: number;
}

const SNOWFLAKE_COUNT = 80;

export default function Snowfall() {
  const flakes = useMemo<SnowflakeConfig[]>(() => {
    return Array.from({ length: SNOWFLAKE_COUNT }, (_, index) => {
      const left = `${Math.random() * 100}%`;
      const delay = `${Math.random() * 5}s`;
      const duration = `${6 + Math.random() * 6}s`;
      const opacity = 0.4 + Math.random() * 0.6;
      const size = 8 + Math.random() * 8;

      return { left, delay, duration, opacity, size };
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-30">
      {flakes.map((flake, index) => (
        <div
          key={index}
          className="snowflake"
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`
          }}
        >
          ❆
        </div>
      ))}
    </div>
  );
}
