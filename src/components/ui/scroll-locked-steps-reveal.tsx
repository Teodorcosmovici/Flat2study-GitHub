import { useEffect, useRef, useState } from 'react';

interface Step {
  number: string;
  title: string;
  description: string;
  bgColor: string;
}

interface ScrollLockedStepsRevealProps {
  steps: Step[];
  onComplete?: () => void;
}

export const ScrollLockedStepsReveal = ({ steps, onComplete }: ScrollLockedStepsRevealProps) => {
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
      } else if (newProgress <= 0) {
        setTimeout(() => {
          setIsActive(false);
          document.body.style.overflow = '';
          accumulatedDelta.current = 0;
        }, 100);
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

  const applyEasing = (t: number) => {
    // Apple-style smoothstep easing for buttery smooth animations
    return t * t * (3.0 - 2.0 * t);
  };

  const getCubeTransform = (index: number) => {
    const totalSteps = steps.length;
    // Tighter animation - less dead time
    const progressPerStep = 100 / (totalSteps + 0.5);
    const stepProgress = (scrollProgress - progressPerStep * index) / progressPerStep;
    
    if (stepProgress <= 0) {
      // Not yet appeared - off screen right
      return 'translateX(800px) rotateY(-25deg)';
    } else if (stepProgress < 1) {
      // Appearing and moving to position
      const easedProgress = applyEasing(stepProgress);
      // Cube 1 (index 0): left at -350px
      // Cube 2 (index 1): center at 0px
      // Cube 3 (index 2): right at 350px
      const finalX = (index - 1) * 350; // -350, 0, 350
      
      // Start from right (800px) and move to final position
      const currentX = 800 + (finalX - 800) * easedProgress;
      const rotateY = -25 + 25 * easedProgress; // Rotate to flat
      return `translateX(${currentX}px) rotateY(${rotateY}deg)`;
    } else {
      // Final position - cubes arranged left to right
      // Cube 1: -350px, Cube 2: 0px, Cube 3: 350px
      const finalX = (index - 1) * 350;
      return `translateX(${finalX}px) rotateY(0deg)`;
    }
  };

  const getCubeOpacity = (index: number) => {
    const totalSteps = steps.length;
    const progressPerStep = 100 / (totalSteps + 0.5);
    const stepProgress = (scrollProgress - progressPerStep * index) / progressPerStep;
    
    if (stepProgress <= 0) return 0;
    if (stepProgress < 0.2) return applyEasing(stepProgress / 0.2);
    return 1;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 overflow-hidden"
      style={{ perspective: '2000px' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-7xl h-96 flex items-center justify-center">
          {steps.map((step, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                opacity: getCubeOpacity(index),
                transform: getCubeTransform(index),
                transition: 'opacity 0.05s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.05s cubic-bezier(0.4, 0.0, 0.2, 1)',
                willChange: 'opacity, transform',
                transformStyle: 'preserve-3d',
              }}
            >
              <div 
                className="w-72 h-80 rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Cube face - consistent color for all */}
                <div 
                  className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-white/20"
                  style={{
                    transform: 'translateZ(20px)',
                  }}
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-3xl font-bold text-primary">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-white/90 text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Cube depth/side effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10 rounded-2xl"
                  style={{
                    transform: 'translateZ(10px)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      {isActive && scrollProgress < 100 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm animate-pulse">
          Scroll to continue
        </div>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
        {steps.map((_, index) => {
          const totalSteps = steps.length;
          const progressPerStep = 100 / (totalSteps + 0.5);
          const stepProgress = (scrollProgress - progressPerStep * index) / progressPerStep;
          const isActive = stepProgress > 0 && stepProgress < 1;
          const isComplete = stepProgress >= 1;
          
          return (
            <div
              key={index}
              className={`h-1 w-12 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-white' : isActive ? 'bg-white/60' : 'bg-white/20'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
