import { useEffect, useRef, useState } from 'react';

interface ScrollLockedTextRevealProps {
  items: Array<{ title: string; description: string }>;
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
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && scrollProgress < 100) {
            setIsActive(true);
            document.body.style.overflow = 'hidden';
            window.scrollTo({ top: container.offsetTop, behavior: 'smooth' });
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (scrollProgress >= 100) {
        document.body.style.overflow = '';
      }
    };
  }, [scrollProgress]);

  useEffect(() => {
    if (!isActive) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      accumulatedDelta.current += e.deltaY;
      const newProgress = Math.max(0, Math.min(100, accumulatedDelta.current / 50));
      setScrollProgress(newProgress);

      if (newProgress >= 100) {
        setTimeout(() => {
          setIsActive(false);
          document.body.style.overflow = '';
          accumulatedDelta.current = 0;
          onComplete?.();
        }, 500);
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouch, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouch);
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
      className="relative w-full min-h-screen h-screen flex items-center justify-center bg-primary overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {items.map((item, index) => (
          <div
            key={index}
            className="absolute text-center px-8 max-w-5xl"
            style={{
              opacity: getItemOpacity(index),
              transform: getItemTransform(index),
              transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-6">
              {item.title}
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 font-medium">
              {item.description}
            </p>
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
