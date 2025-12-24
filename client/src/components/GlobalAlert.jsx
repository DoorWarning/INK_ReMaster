// client/src/components/GlobalAlert.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAlertStore from '../store/useAlertStore';

const GlobalAlert = () => {
  const { isOpen, message, type, closeAlert, onConfirm } = useAlertStore();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeAlert();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-white border-3 border-ink p-6 min-w-[300px] max-w-sm shadow-[8px_8px_0px_0px_var(--color-ink)] text-center rounded-sm"
          >
            <h3 className="text-xl font-display mb-4 text-ink">INK NOTICE</h3>
            <p className="text-gray-700 font-medium mb-8 whitespace-pre-wrap">{message}</p>
            
            <div className="flex justify-center gap-3">
              {type === 'confirm' && (
                <button 
                  onClick={closeAlert}
                  className="flex-1 px-4 py-2 border-2 border-ink font-bold hover:bg-gray-100 transition-colors"
                >
                  취소
                </button>
              )}
              <button 
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-ink text-white border-2 border-ink font-bold hover:bg-gray-800 transition-colors"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalAlert;