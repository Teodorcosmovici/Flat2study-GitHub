import { useEffect, useRef, useState } from 'react';

interface ScrollLockedCounterProps {
  stats: Array<{
    number: string;
    label: string;
    sublabel: string;
  }>;
}

export function ScrollLockedCounter({ stats }: ScrollLockedCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counters, setCounters] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const targetValues = useRef<number[]>([]);

  useEffect(() => {
    // Parse target values from stats
    targetValues.current = stats.map(stat => {
      const num = stat.number.replace(/[^0-9]/g, '');
      return parseInt(num) || 0;
    });
    setCounters(new Array(stats.length).fill(0));
  }, [stats]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || hasAnimated) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionMiddle = rect.top + rect.height / 2;
      const windowMiddle = windowHeight / 2;

      // Check if section is in the middle of viewport
      if (Math.abs(sectionMiddle - windowMiddle) < 100 && !isAnimating) {
        setIsAnimating(true);
        document.body.style.overflow = 'hidden';
        
        // Animate counters
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function (ease-out)
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          setCounters(targetValues.current.map(target => 
            Math.floor(target * easeOut)
          ));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Animation complete
            setTimeout(() => {
              document.body.style.overflow = '';
              setIsAnimating(false);
              setHasAnimated(true);
            }, 500);
          }
        };
        
        animate();
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = '';
    };
  }, [isAnimating, hasAnimated]);

  const formatNumber = (value: number, original: string) => {
    // Preserve the original format (e.g., "250k+", "15+")
    if (original.includes('k')) {
      return `${value}k+`;
    }
    if (original.includes('+')) {
      return `${value}+`;
    }
    return value.toString();
  };

  return (
    <section 
      ref={sectionRef}
      className="py-16 px-4 bg-background min-h-screen flex items-center"
    >
      <div className="container mx-auto max-w-6xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-bold text-primary">
                {hasAnimated || isAnimating 
                  ? formatNumber(counters[index] || 0, stat.number)
                  : '0'
                }
              </h3>
              <p className="text-lg font-medium text-foreground">
                {stat.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
