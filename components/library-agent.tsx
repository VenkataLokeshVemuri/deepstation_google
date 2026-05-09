'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, BookOpen, ShoppingCart, Calendar, Sparkles } from 'lucide-react';
import { useNotification } from './whatsapp-notification';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  available: boolean;
}

export function LibraryAgent() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [agenticQuery, setAgenticQuery] = useState('');
  const { sendWhatsAppNotification } = useNotification();

  const performAgenticMatch = async () => {
    if (!agenticQuery.trim() || books.length === 0) return;
    setIsMatching(true);
    setMatches({});
    try {
      // Perform LLM match to select top 3 and explain why using the current visible books
      const res = await fetch('/api/agentic-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Library Books',
          documentText: agenticQuery,
          items: books.slice(0, 50)
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

        // Re-sort so AI matches are at the top
        setBooks(prev => {
          const sorted = [...prev].sort((a, b) => {
            const aMatch = matchMap[a.id] ? 1 : 0;
            const bMatch = matchMap[b.id] ? 1 : 0;
            return bMatch - aMatch;
          });
          return sorted;
        });
        if (data.length > 0) {
          sendWhatsAppNotification('u have requested this book');
        }
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setIsMatching(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://openlibrary.org/search.json?q=programming&limit=20');
        const data = await res.json();
        if (data && data.docs) {
          const formattedBooks = data.docs.map((doc: any) => ({
            id: doc.key,
            title: doc.title,
            author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
            price: Math.floor(Math.random() * 40) + 10, // Simulated price since OpenLibrary doesn't have prices
            available: Math.random() > 0.2 // Simulated availability
          }));
          setAllBooks(formattedBooks);
          setBooks(formattedBooks);
        }
      } catch (err) {
        console.error('Failed to fetch dataset:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setBooks(allBooks);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=20`);
      const data = await res.json();
      if (data && data.docs) {
        const formattedBooks = data.docs.map((doc: any) => ({
          id: doc.key,
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
          price: Math.floor(Math.random() * 40) + 10,
          available: Math.random() > 0.2
        }));
        setBooks(formattedBooks);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (book: Book) => {
    sendWhatsAppNotification(`Library Agent: Confirmed! You just purchased "${book.title}" for $${book.price}. Enjoy reading!`);
  };

  const handleRent = (book: Book) => {
    sendWhatsAppNotification(`Library Agent: You rented "${book.title}". Please return in 14 days.`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <BookOpen />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Library Agent</h2>
          <p className="text-sm text-slate-500">Live data sourced from Open Library API</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              placeholder="✨ Describe your ideal books to let AI auto-select them..."
              value={agenticQuery}
              onChange={(e) => setAgenticQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performAgenticMatch()}
              className="w-full px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-blue-400"
            />
            <button 
                onClick={performAgenticMatch}
                disabled={isMatching || isInitializing || books.length === 0 || !agenticQuery.trim()}
                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 font-medium text-sm"
            >
              {isMatching ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="hidden md:inline">Auto-Select</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching real-time Open Library dataset...</p>
          </div>
        ) : (
        <div className="grid gap-4">
          {books.map(book => (
            <div key={book.id} className="flex flex-col sm:flex-row gap-4 items-center p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-slate-200 transition-colors">
              <div className="flex-1 w-full text-left">
                <h3 className="font-semibold text-slate-800">{book.title}</h3>
                <p className="text-sm text-slate-500">{book.author}</p>
                <p className="text-sm font-medium mt-1 text-slate-700">${book.price}</p>
                {matches[book.id] && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                    <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-blue-800"><span className="font-semibold">AI Match:</span> {matches[book.id]}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button 
                    disabled={!book.available}
                    onClick={() => handleBuy(book)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ShoppingCart size={16} /> Buy
                </button>
                <button 
                  disabled={!book.available}
                  onClick={() => handleRent(book)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Calendar size={16} /> Rent
                </button>
              </div>
            </div>
          ))}
          {books.length === 0 && !isLoading && !isInitializing && (
            <div className="text-center py-12 text-slate-500">
              No books found matching your search.
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
