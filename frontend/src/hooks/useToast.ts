import { useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );
  const [closingToast, setClosingToast] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeout_ = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    message: string,
    variant: "success" | "error" = "success",
  ) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (clearTimeout_.current) clearTimeout(clearTimeout_.current);
    setToast(message);
    setToastVariant(variant);
    setClosingToast(false);
    hideTimeout.current = setTimeout(() => {
      setClosingToast(true);
      clearTimeout_.current = setTimeout(() => setToast(null), 200);
    }, 2000);
  };

  return { toast, toastVariant, closingToast, showToast };
}
