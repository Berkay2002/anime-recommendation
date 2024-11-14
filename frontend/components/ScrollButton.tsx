interface ScrollButtonProps {
    direction: 'left' | 'right';
    onClick: () => void;
    show: boolean;
  }
  
  const ScrollButton: React.FC<ScrollButtonProps> = ({ direction, onClick, show }) => {
    if (!show) return null;
  
    return (
      <button
        className={`absolute ${direction === 'left' ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-3 z-10 hover:bg-gray-700 transition-shadow duration-200 shadow-md`}
        onClick={onClick}
      >
        {direction === 'left' ? '←' : '→'}
      </button>
    );
  };
  
  export default ScrollButton;