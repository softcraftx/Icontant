import React, { useEffect, useState } from 'react';

interface HistoryItem {
  id: number;
  website_name: string;
  topic: string;
  seo_title: string;
  created_at: string;
}

interface HistoryViewProps {
  onSelect: (id: number) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelect, onBack }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setHistory(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const groupedHistory = history.reduce((acc, item) => {
    if (!acc[item.website_name]) {
      acc[item.website_name] = [];
    }
    acc[item.website_name].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Article History
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back to Generator
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No articles found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            You haven't generated any articles yet. Start by creating your first masterpiece!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedHistory).map(([website, items]) => (
            <div key={website} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800"></div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] bg-slate-900 px-4 py-1 rounded-full border border-slate-800">
                  {website}
                </h3>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-left hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="text-slate-200 font-semibold text-sm line-clamp-2 group-hover:text-white transition-colors mb-3 h-10 relative z-10">
                      {item.seo_title || item.topic}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/50 pt-3 relative z-10">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Article
                      </div>
                      <div className="text-slate-600 italic">
                        #{item.id}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
