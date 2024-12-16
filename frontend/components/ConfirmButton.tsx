// frontend/components/ConfirmButton.tsx
import { useEffect } from 'react';

export default function ConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg"
    >
      Confirm
    </button>
  );
}