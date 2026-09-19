import { useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const [closingToast, setClosingToast] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeout_ = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (clearTimeout_.current) clearTimeout(clearTimeout_.current);
    setToast(message);
    setClosingToast(false);
    hideTimeout.current = setTimeout(() => {
      setClosingToast(true);
      clearTimeout_.current = setTimeout(() => setToast(null), 200);
    }, 2000);
  };

  return { toast, closingToast, showToast };
}
