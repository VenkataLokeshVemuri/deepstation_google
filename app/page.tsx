'use client';

import { useState } from 'react';
import { Bot, BookOpen, Briefcase, Landmark, Home } from 'lucide-react';
import { NotificationProvider } from '@/components/whatsapp-notification';
import { OrchestratorChat } from '@/components/orchestrator-chat';
import { LibraryAgent } from '@/components/library-agent';
import { JobAgent } from '@/components/job-agent';
import { GrantAgent } from '@/components/grant-agent';
import { HousingAgent } from '@/components/housing-agent';

type AgentView = 'orchestrator' | 'library' | 'job' | 'grant' | 'housing';

export default function Page() {
  const [activeView, setActiveView] = useState<AgentView>('orchestrator');

  const navItems = [
    { id: 'orchestrator', label: 'Orchestrator', icon: Bot, color: 'text-indigo-600', bgHover: 'hover:bg-indigo-50' },
    { id: 'library', label: 'Library Agent', icon: BookOpen, color: 'text-blue-600', bgHover: 'hover:bg-blue-50' },
    { id: 'job', label: 'Job Agent', icon: Briefcase, color: 'text-purple-600', bgHover: 'hover:bg-purple-50' },
    { id: 'grant', label: 'Grant Agent', icon: Landmark, color: 'text-emerald-600', bgHover: 'hover:bg-emerald-50' },
    { id: 'housing', label: 'Housing Agent', icon: Home, color: 'text-amber-600', bgHover: 'hover:bg-amber-50' },
  ] as const;

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-slate-100 font-sans p-2 gap-2">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Bot className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">Orchestra</h1>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">Agents</div>
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 shadow-sm' 
                      : `text-slate-600 hover:text-slate-900 ${item.bgHover}`
                  }`}
                >
                  <Icon size={18} className={isActive ? item.color : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 text-center">
              Powered by Gemini & Kaggle
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full">
            {activeView === 'orchestrator' && <OrchestratorChat />}
            {activeView === 'library' && <LibraryAgent />}
            {activeView === 'job' && <JobAgent />}
            {activeView === 'grant' && <GrantAgent />}
            {activeView === 'housing' && <HousingAgent />}
        </main>
      </div>
    </NotificationProvider>
  );
}
