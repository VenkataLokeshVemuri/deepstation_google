'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function OrchestratorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        "Hello! I am the Orchestrator Agent. How can I help you today? I can manage the **Library**, **Grant**, **Job**, and **Housing** agents for you.\n\nAsk me anything or switch agents from the sidebar.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }] })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.text || data.message || "I'm not sure how to respond to that." },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Oops, something went wrong while communicating with the orchestrator.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`p-2 rounded-full shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="markdown-body prose prose-slate prose-sm max-w-none">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full shrink-0 bg-slate-100 text-slate-700">
              <Bot size={20} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-500 rounded-tl-none max-w-[80%] flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the orchestrator..."
            className="flex-1 bg-white border border-slate-300 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
