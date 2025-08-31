import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        setIsExpired(true);
        onExpire?.();
        clearInterval(timer);
      }
    }, 1000);

    // Initialize with current time
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (isExpired) {
    return (
      <div className={`text-red-600 font-bold ${className}`}>
        <Clock className="inline mr-2 h-5 w-5" />
        ¡Oferta Expirada!
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`} data-testid="countdown-timer">
      <Clock className="h-5 w-5 text-red-500 animate-pulse" />
      <div className="flex space-x-2">
        <div className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold min-w-[3rem] text-center">
          <div className="text-lg">{timeLeft.days.toString().padStart(2, '0')}</div>
          <div className="text-xs">días</div>
        </div>
        <div className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold min-w-[3rem] text-center">
          <div className="text-lg">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs">hrs</div>
        </div>
        <div className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold min-w-[3rem] text-center">
          <div className="text-lg">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs">min</div>
        </div>
        <div className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold min-w-[3rem] text-center">
          <div className="text-lg">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs">seg</div>
        </div>
      </div>
    </div>
  );
}