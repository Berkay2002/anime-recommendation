import { useState, useRef, useEffect } from 'react';

export const useScroll = () => {
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(true);
  const [showRightArrow, setShowRightArrow] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const calculateScrollAmount = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const cardWidth = cardRef.current ? cardRef.current.offsetWidth : 200;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    return visibleCards * cardWidth;
  };

  const scrollLeft = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < maxScrollLeft - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  return { containerRef, cardRef, showLeftArrow, showRightArrow, scrollLeft, scrollRight };
};