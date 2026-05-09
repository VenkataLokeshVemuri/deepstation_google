'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, FileText, Sparkles } from 'lucide-react';
import { useNotification } from './whatsapp-notification';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
}

export function JobAgent() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [agenticQuery, setAgenticQuery] = useState('');
  const { sendWhatsAppNotification } = useNotification();

  const performAgenticMatch = async () => {
    if (!agenticQuery.trim() || jobs.length === 0) return;
    setIsMatching(true);
    setMatches({});
    try {
      // 1. Perform LLM match to select top 3 and explain why
      const res = await fetch('/api/agentic-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Job Listings',
          documentText: agenticQuery,
          items: jobs.slice(0, 50)
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
        setJobs(prev => {
          const sorted = [...prev].sort((a, b) => {
            const aMatch = matchMap[a.id] ? 1 : 0;
            const bMatch = matchMap[b.id] ? 1 : 0;
            return bMatch - aMatch;
          });
          return sorted;
        });
        if (data.length > 0) {
          sendWhatsAppNotification('u have applied for this job');
        }
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const fetchJobs = async (query: string = '') => {
    setIsInitializing(true);
    setErrorConfig(null);
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'MISSING_CREDENTIALS') {
            setErrorConfig(data.message);
        }
        setAllJobs([]);
        setJobs([]);
        return;
      }

      if (data && data.results) {
        const formattedJobs = data.results.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company?.display_name || 'Unknown',
            location: job.location?.display_name || 'Remote',
            salary: job.salary_min && job.salary_max ? `$${Math.round(job.salary_min/1000)}k - $${Math.round(job.salary_max/1000)}k` : 'Salary Unspecified'
        }));
        setAllJobs(formattedJobs);
        setJobs(formattedJobs);
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
    fetchJobs('software engineer');
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
        setJobs(allJobs);
        return;
    }
    setIsLoading(true);
    fetchJobs(searchTerm);
  };

  const handleApply = (job: Job) => {
    sendWhatsAppNotification(`Job Agent: Application submitted for "${job.title}" at ${job.company}. Good luck!`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <Briefcase />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Job Agent</h2>
          <p className="text-sm text-slate-500">Live data sourced from Adzuna API</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              placeholder="✨ Tell the AI about your setup/career to auto-select jobs..."
              value={agenticQuery}
              onChange={(e) => setAgenticQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performAgenticMatch()}
              className="w-full px-4 py-2 border border-purple-200 bg-purple-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm placeholder-purple-400"
            />
            <button 
                onClick={performAgenticMatch}
                disabled={isMatching || isInitializing || jobs.length === 0 || !agenticQuery.trim()}
                className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 font-medium text-sm"
            >
              {isMatching ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="hidden md:inline">Auto-Select</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {errorConfig ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 max-w-md mx-auto text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
            <Briefcase size={48} className="text-purple-400" />
            <h3 className="font-bold text-lg text-slate-800">API Credentials Required</h3>
            <p className="text-sm">{errorConfig}</p>
            <div className="text-xs text-left w-full mt-4 bg-white p-4 rounded border border-slate-200">
              <p className="font-bold mb-2">How to get Adzuna API Keys:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to <a href="https://developer.adzuna.com/" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">developer.adzuna.com</a></li>
                <li>Sign up for a free developer account</li>
                <li>Create an Application</li>
                <li>Copy the App ID and App Key</li>
                <li>Open <strong>Settings &gt; Secrets</strong> in AI Studio and add <code>ADZUNA_APP_ID</code> and <code>ADZUNA_APP_KEY</code></li>
              </ol>
            </div>
            <button onClick={() => fetchJobs('software engineer')} className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Retry Connection
            </button>
          </div>
        ) : isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching real-time job listings from Adzuna...</p>
          </div>
        ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job.id} className="flex flex-col sm:flex-row gap-4 items-center p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-slate-200 transition-colors">
              <div className="flex-1 w-full text-left">
                <h3 className="font-semibold text-slate-800">{job.title}</h3>
                <p className="text-sm font-medium text-slate-700">{job.company}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span className="bg-slate-200 px-2 py-1 rounded">{job.location}</span>
                  <span className="bg-slate-200 px-2 py-1 rounded">{job.salary}</span>
                </div>
                {matches[job.id] && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start gap-2">
                    <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-purple-800"><span className="font-semibold">AI Match:</span> {matches[job.id]}</p>
                  </div>
                )}
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <button 
                    onClick={() => handleApply(job)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FileText size={16} /> Apply Now
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && !isLoading && !isInitializing && (
            <div className="text-center py-12 text-slate-500">
              No jobs found matching your search.
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
