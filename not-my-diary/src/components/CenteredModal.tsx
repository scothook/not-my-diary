import React, { useEffect } from "react";
import styles from "./CenteredModal.module.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isClosable?: boolean;
  title?: string;
  children?: React.ReactNode;
};

export default function CenteredModal({ isOpen, onClose, isClosable = true, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div className={styles.overlay} />

      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title ?? "Modal Title"}</h2>
          {isClosable && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className={styles.closeButton}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
