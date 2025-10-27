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

      // Release lock when scrolling back to start
      if (newProgress <= 0) {
        setTimeout(() => {
          setIsActive(false);
          document.body.style.overflow = '';
          accumulatedDelta.current = 0;
        }, 100);
      }

      // Release lock when reaching the end
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

  const applyEasing = (t: number) => {
    // Apple-style easing: cubic-bezier(0.25, 0.1, 0.25, 1)
    // Smooth acceleration and deceleration
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getItemOpacity = (index: number) => {
    const currentIndex = getCurrentItem();
    const progress = (scrollProgress / 100) * items.length;
    const itemProgress = progress - index;

    if (index === currentIndex) {
      // Smooth fade in from 0 to 0.5, then faster fade out from 0.5 to 1
      if (itemProgress < 0.5) {
        const t = itemProgress * 2; // 0 to 1
        return applyEasing(t);
      } else {
        const t = (itemProgress - 0.5) * 2; // 0 to 1
        return 1 - applyEasing(t) * 1.5; // Faster fade out
      }
    } else if (index < currentIndex) {
      return 0;
    } else if (index > currentIndex) {
      // Show next item with low opacity when scrolling back
      if (index === currentIndex + 1 && itemProgress < 0) {
        const t = Math.abs(itemProgress) * 2;
        return applyEasing(Math.min(t, 1)) * 0.3;
      }
    }
    return 0;
  };

  const getItemTransform = (index: number) => {
    const currentIndex = getCurrentItem();
    const progress = (scrollProgress / 100) * items.length;
    const itemProgress = progress - index;

    if (index === currentIndex) {
      // Smooth movement until center, then slow down at center
      if (itemProgress < 0.4) {
        // Normal speed entry (0 to 0.4)
        const t = itemProgress / 0.4;
        const easedT = applyEasing(t);
        const translateY = (1 - easedT) * 60;
        return `translateY(${translateY}%)`;
      } else if (itemProgress < 0.6) {
        // Slow down at center (0.4 to 0.6)
        const t = (itemProgress - 0.4) / 0.2;
        const slowT = t * 0.3; // Much slower movement
        const translateY = -slowT * 20;
        return `translateY(${translateY}%)`;
      } else {
        // Speed up exit (0.6 to 1)
        const t = (itemProgress - 0.6) / 0.4;
        const easedT = applyEasing(t);
        const translateY = -6 - easedT * 54; // Continue from -6% to -60%
        return `translateY(${translateY}%)`;
      }
    } else if (index < currentIndex) {
      return `translateY(-100%)`;
    } else if (index > currentIndex) {
      // Next items below
      return `translateY(100%)`;
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
              transition: 'opacity 0.1s linear, transform 0.1s linear',
              willChange: 'opacity, transform',
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
