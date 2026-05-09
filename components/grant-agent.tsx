'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Landmark, CheckSquare, Sparkles } from 'lucide-react';
import { useNotification } from './whatsapp-notification';

interface Grant {
  id: string;
  title: string;
  amount: string;
  deadline: string;
  provider: string;
}

export function GrantAgent() {
  const [allGrants, setAllGrants] = useState<Grant[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [agenticQuery, setAgenticQuery] = useState('');
  const { sendWhatsAppNotification } = useNotification();

  const performAgenticMatch = async () => {
    if (!agenticQuery.trim() || grants.length === 0) return;
    setIsMatching(true);
    setMatches({});
    try {
      // 1. Perform LLM match to select top 3 and explain why
      const res = await fetch('/api/agentic-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Grants and Funding',
          documentText: agenticQuery,
          items: grants.slice(0, 50)
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const matchMap: Record<string, string> = {};
        data.forEach((item: any) => {
          if (item.id && item.match_reason) {
            matchMap[item.id] = item.match_reason;
          }
        });
        setMatches(matchMap);

        // 2. Re-sort so matches are at the top
        setGrants(prev => {
          const sorted = [...prev].sort((a, b) => {
            const aMatch = matchMap[a.id] ? 1 : 0;
            const bMatch = matchMap[b.id] ? 1 : 0;
            return bMatch - aMatch;
          });
          return sorted;
        });
        if (data.length > 0) {
          sendWhatsAppNotification('u have applied for this grant');
        }
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const fetchGrants = async (query: string = '') => {
    setIsInitializing(true);
    setErrorConfig(null);
    try {
      const res = await fetch(`/api/grants?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'MISSING_CREDENTIALS') {
            setErrorConfig(data.message);
        }
        setAllGrants([]);
        setGrants([]);
        return;
      }
      
      if (Array.isArray(data)) {
        setAllGrants(data);
        setGrants(data);
      }
    } catch (err) {
      console.error('Failed to fetch dataset:', err);
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGrants('environment and technology');
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
        setGrants(allGrants);
        return;
    }
    setIsLoading(true);
    fetchGrants(searchTerm);
  };

  const handleApply = (grant: Grant) => {
    sendWhatsAppNotification(`Grant Agent: Your proposal for "${grant.title}" (${grant.amount}) has been drafted and submitted.`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <Landmark />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Grant Agent</h2>
          <p className="text-sm text-slate-500">Live data synthesized via AI Grants Simulator</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search grants or funding..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
          </button>
        </div>
        <div className="flex gap-2">
            <input
              type="text"
              placeholder="✨ Describe your project/startup to let AI auto-select grants..."
              value={agenticQuery}
              onChange={(e) => setAgenticQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performAgenticMatch()}
              className="w-full px-4 py-2 border border-emerald-200 bg-emerald-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-emerald-400"
            />
            <button 
                onClick={performAgenticMatch}
                disabled={isMatching || isInitializing || grants.length === 0 || !agenticQuery.trim()}
                className="px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 font-medium text-sm"
            >
              {isMatching ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="hidden md:inline">Auto-Select</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {errorConfig ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 max-w-md mx-auto text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
            <Landmark size={48} className="text-emerald-400" />
            <h3 className="font-bold text-lg text-slate-800">API Credentials Required</h3>
            <p className="text-sm">{errorConfig}</p>
            <div className="text-xs text-left w-full mt-4 bg-white p-4 rounded border border-slate-200">
              <p className="font-bold mb-2">How to fix your Gemini API Key:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Google AI Studio</a></li>
                <li>Generate a new API Key</li>
                <li>Open <strong>Settings &gt; Secrets</strong> in this preview (gear icon) and add/update <code>NEXT_PUBLIC_GEMINI_API_KEY</code> or <code>GEMINI_API_KEY</code></li>
            </ol>
            </div>
            <button onClick={() => fetchGrants('environment and technology')} className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
              Retry Connection
            </button>
          </div>
        ) : isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching active grants streams...</p>
          </div>
        ) : (
        <div className="grid gap-4">
          {grants.map(grant => (
            <div key={grant.id} className="flex flex-col sm:flex-row gap-4 items-center p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-slate-200 transition-colors">
              <div className="flex-1 w-full text-left">
                <h3 className="font-semibold text-slate-800">{grant.title}</h3>
                <p className="text-sm font-medium text-slate-700">{grant.provider}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">{grant.amount}</span>
                  <span className="bg-slate-200 px-2 py-1 rounded">Closes: {grant.deadline}</span>
                </div>
                {matches[grant.id] && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2">
                    <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-emerald-800"><span className="font-semibold">AI Match:</span> {matches[grant.id]}</p>
                  </div>
                )}
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <button 
                    onClick={() => handleApply(grant)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CheckSquare size={16} /> Apply Now
                </button>
              </div>
            </div>
          ))}
          {grants.length === 0 && !isLoading && !isInitializing && (
            <div className="text-center py-12 text-slate-500">
              No grants found matching your search.
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
