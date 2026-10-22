import { ReactNode, useEffect, useId, useRef } from 'react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    element.showModal();
    element.querySelector<HTMLInputElement>('input, textarea')?.focus();
    return () => {
      element.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={onClose} className="queue-dialog">
      <div className="bg-[#232633] rounded-lg p-6 border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-xl font-bold text-gray-300">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="text-gray-400 hover:text-gray-300 text-2xl">×</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
