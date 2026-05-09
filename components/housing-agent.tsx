'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Home, Key, Sparkles } from 'lucide-react';
import { useNotification } from './whatsapp-notification';

interface House {
  id: string;
  title: string;
  location: string;
  price: string;
  type: string;
}

export function HousingAgent() {
  const [allHouses, setAllHouses] = useState<House[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [agenticQuery, setAgenticQuery] = useState('');
  const { sendWhatsAppNotification } = useNotification();

  const performAgenticMatch = async () => {
    if (!agenticQuery.trim() || houses.length === 0) return;
    setIsMatching(true);
    setMatches({});
    try {
      // 1. Perform LLM match to select top 3 and explain why
      const res = await fetch('/api/agentic-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Housing Listings',
          documentText: agenticQuery,
          items: houses.slice(0, 50)
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
        setHouses(prev => {
          const sorted = [...prev].sort((a, b) => {
            const aMatch = matchMap[a.id] ? 1 : 0;
            const bMatch = matchMap[b.id] ? 1 : 0;
            return bMatch - aMatch;
          });
          return sorted;
        });
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const fetchHousing = async (query: string = 'Austin, TX') => {
    setIsInitializing(true);
    setErrorConfig(null);
    try {
      const res = await fetch(`/api/housing?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'MISSING_CREDENTIALS') {
            setErrorConfig(data.message);
        }
        setAllHouses([]);
        setHouses([]);
        return;
      }

      if (Array.isArray(data)) {
        setAllHouses(data);
        setHouses(data);
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
    fetchHousing('Austin, TX');
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
        setHouses(allHouses);
        return;
    }
    setIsLoading(true);
    fetchHousing(searchTerm); // Rentcast expects City, State
  };

  const handleInquire = (house: House) => {
    sendWhatsAppNotification(`Housing Agent: Inquiry sent for "${house.title}". The agent will contact you shortly.`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
          <Home />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Housing Agent</h2>
          <p className="text-sm text-slate-500">Live data synthesized via AI Housing Simulator</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search city, state (e.g., Austin, TX)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              placeholder="✨ Describe your ideal home to let AI auto-select it..."
              value={agenticQuery}
              onChange={(e) => setAgenticQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performAgenticMatch()}
              className="w-full px-4 py-2 border border-amber-200 bg-amber-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm placeholder-amber-400"
            />
            <button 
                onClick={performAgenticMatch}
                disabled={isMatching || isInitializing || houses.length === 0 || !agenticQuery.trim()}
                className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 font-medium text-sm"
            >
              {isMatching ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="hidden md:inline">Auto-Select</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {errorConfig ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 max-w-md mx-auto text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
            <Home size={48} className="text-amber-400" />
            <h3 className="font-bold text-lg text-slate-800">API Credentials Required</h3>
            <p className="text-sm">{errorConfig}</p>
            <div className="text-xs text-left w-full mt-4 bg-white p-4 rounded border border-slate-200">
              <p className="font-bold mb-2">How to fix your Gemini API Key:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline">Google AI Studio</a></li>
                <li>Generate a new API Key</li>
                <li>Open <strong>Settings &gt; Secrets</strong> in this preview (gear icon) and add/update <code>NEXT_PUBLIC_GEMINI_API_KEY</code> or <code>GEMINI_API_KEY</code></li>
            </ol>
            </div>
            <button onClick={() => fetchHousing('Austin, TX')} className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
              Retry Connection
            </button>
          </div>
        ) : isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching property listings streams...</p>
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {houses.map(house => (
            <div key={house.id} className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${house.type === 'Rent' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  For {house.type}
                </span>
                <span className="font-bold text-amber-600">{house.price}</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{house.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{house.location}</p>
              {matches[house.id] && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                  <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-amber-800"><span className="font-semibold">AI Match:</span> {matches[house.id]}</p>
                </div>
              )}
              
              <div className="mt-auto pt-4 border-t border-slate-200">
                <button 
                    onClick={() => handleInquire(house)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Key size={16} /> Contact Agent
                </button>
              </div>
            </div>
          ))}
          {houses.length === 0 && !isLoading && !isInitializing && (
            <div className="text-center py-12 text-slate-500 md:col-span-2">
              No houses found matching your search.
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
