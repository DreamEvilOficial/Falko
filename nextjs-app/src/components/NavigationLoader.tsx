"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);

      // Simular progreso durante la navegación
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 10 + 5;
        });
      }, 100);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 50);

      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    // Escuchar eventos de navegación
    const originalPush = window.history.pushState;
    window.history.pushState = function (...args) {
      handleStart();
      setTimeout(handleComplete, 10); // Simular tiempo de navegación
      return originalPush.apply(window.history, args);
    };

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      window.history.pushState = originalPush;
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ scaleX: 1, transition: { duration: 0.3 } }}
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-pink-400 to-pink-500 z-[999999] origin-left"
          style={{ width: "100%" }}
        />
      )}
    </AnimatePresence>
  );
}
