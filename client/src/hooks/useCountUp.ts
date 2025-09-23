import { useEffect, useState } from "react";

export function useCountUp(end: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return value;
}
