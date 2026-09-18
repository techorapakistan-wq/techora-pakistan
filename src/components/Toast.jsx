import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="toast-container"
          role="status"
          aria-live="polite"
        >
          <div className="toast-dot" aria-hidden="true" />
          <span className="toast-text">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
