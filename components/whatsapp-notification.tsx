'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';

interface NotificationContextProps {
  sendWhatsAppNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);

  const sendWhatsAppNotification = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000); // Disappear after 5 seconds
  };

  return (
    <NotificationContext.Provider value={{ sendWhatsAppNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-green-600 text-white rounded-lg p-4 shadow-xl flex items-start gap-3 w-80 pointer-events-auto"
            >
              <div className="bg-white/20 p-2 rounded-full mt-0.5">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">WhatsApp</h4>
                <p className="text-sm text-green-50 mt-1">{msg.text}</p>
              </div>
              <button
                onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                className="text-green-200 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
