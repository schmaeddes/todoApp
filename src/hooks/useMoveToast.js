import { useEffect, useRef, useState } from 'react';

export default function useMoveToast() {
  const toastFadeOutRef = useRef(null);
  const toastRemoveRef = useRef(null);
  const [moveToast, setMoveToast] = useState(null);

  function showMoveToast(taskText, listLabel) {
    if (toastFadeOutRef.current) clearTimeout(toastFadeOutRef.current);
    if (toastRemoveRef.current) clearTimeout(toastRemoveRef.current);

    const id = Date.now();
    setMoveToast({ id, taskText, listLabel, visible: false });

    requestAnimationFrame(() => {
      setMoveToast({ id, taskText, listLabel, visible: true });
    });

    toastFadeOutRef.current = setTimeout(() => {
      setMoveToast((current) =>
        current?.id === id ? { ...current, visible: false } : current,
      );
    }, 3300);

    toastRemoveRef.current = setTimeout(() => {
      setMoveToast((current) => (current?.id === id ? null : current));
    }, 3600);
  }

  useEffect(() => {
    return () => {
      if (toastFadeOutRef.current) clearTimeout(toastFadeOutRef.current);
      if (toastRemoveRef.current) clearTimeout(toastRemoveRef.current);
    };
  }, []);

  return { moveToast, showMoveToast };
}
