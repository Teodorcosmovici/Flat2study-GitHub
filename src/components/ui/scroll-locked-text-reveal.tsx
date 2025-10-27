import { useEffect, useRef, useState } from 'react';

interface ScrollLockedTextRevealProps {
  items: string[];
  onComplete?: () => void;
}

export const ScrollLockedTextReveal = ({ items, onComplete }: ScrollLockedTextRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const accumulatedDelta = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsActive(true);
            document.body.style.overflow = 'hidden';
          } else if (!entry.isIntersecting && isActive) {
            setIsActive(false);
            document.body.style.overflow = '';
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      accumulatedDelta.current += e.deltaY;
      const newProgress = Math.max(0, Math.min(100, accumulatedDelta.current / 20));
      setScrollProgress(newProgress);

      if (newProgress >= 100) {
        setIsActive(false);
        document.body.style.overflow = '';
        onComplete?.();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isActive, onComplete]);

  const getCurrentItem = () => {
    const itemIndex = Math.floor((scrollProgress / 100) * items.length);
    return Math.min(itemIndex, items.length - 1);
  };

  const getItemOpacity = (index: number) => {
    const currentIndex = getCurrentItem();
    const progress = (scrollProgress / 100) * items.length;
    const itemProgress = progress - index;

    if (index === currentIndex) {
      return Math.min(1, Math.max(0, itemProgress));
    } else if (index < currentIndex) {
      return Math.max(0, 1 - (currentIndex - index) * 0.5);
    }
    return 0;
  };

  const getItemTransform = (index: number) => {
    const currentIndex = getCurrentItem();
    const progress = (scrollProgress / 100) * items.length;
    const itemProgress = progress - index;

    if (index === currentIndex) {
      const translateY = (1 - itemProgress) * 100;
      return `translateY(${translateY}%)`;
    } else if (index < currentIndex) {
      const translateY = -((currentIndex - index) * 100);
      return `translateY(${translateY}%)`;
    }
    return 'translateY(100%)';
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-primary via-primary-glow to-primary overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {items.map((item, index) => (
          <div
            key={index}
            className="absolute text-center px-8"
            style={{
              opacity: getItemOpacity(index),
              transform: getItemTransform(index),
              transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            }}
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
              {item}
            </h2>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      {isActive && scrollProgress < 100 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm animate-pulse">
          Scroll to continue
        </div>
      )}
    </div>
  );
};
