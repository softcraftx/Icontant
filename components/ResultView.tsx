import React, { useState, useMemo } from 'react';
import { SeoResult, GroundingSource, Category, Subcategory } from '../types';
import { postArticleToUpanel } from '../services/upanelService';

interface ResultViewProps {
  data: SeoResult;
  sources: GroundingSource[];
  onBack: () => void;
  upanelConfig?: {
    categoryId: number;
    subcategoryId?: number;
  };
  categories?: Category[];
  subcategories?: Subcategory[];
  onCategoryChange?: (id: number) => void;
  onSubcategoryChange?: (id: number) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ 
  data, 
  sources, 
  onBack, 
  upanelConfig,
  categories = [],
  subcategories = [],
  onCategoryChange,
  onSubcategoryChange
}) => {
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});
  const [postStatus, setPostStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');
  const [postError, setPostError] = useState('');

  const wordCount = useMemo(() => {
    const text = data.articleContent.replace(/<[^>]*>/g, ' ');
    return text.split(/\s+/).filter(w => w.trim().length > 0).length;
  }, [data.articleContent]);

  const handleCopy = (text: string, key: string) => {
    let finalContent = text;

    // If copying the full article, we prepend the CSS styles so it stays designed when pasted
    if (key === 'full-article') {
      const styles = `
<style>
  .icontent-article { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #334155; max-width: 800px; margin: 0 auto; }
  .icontent-article h1 { font-size: 2.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 1.5rem; }
  .icontent-article h2 { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
  .icontent-article h3 { font-size: 1.4rem; font-weight: 600; color: #2563eb; margin-top: 1.5rem; }
  .icontent-article p { margin-bottom: 1.25rem; font-size: 1.1rem; }
  .icontent-article blockquote { border-left: 5px solid #3b82f6; background: #f8fafc; padding: 1.5rem; margin: 2rem 0; border-radius: 0 10px 10px 0; font-style: italic; color: #475569; }
  .icontent-article .expert-callout { background: #f0f7ff; border: 1px solid #bfdbfe; padding: 2rem; border-radius: 1rem; margin: 2.5rem 0; }
  .icontent-article .pro-tip { background: #f0fdf4; border: 1px dashed #bbf7d0; padding: 1rem; border-radius: 0.75rem; color: #166534; margin: 1.5rem 0; }
  .icontent-article table { width: 100%; border-collapse: collapse; margin: 2rem 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
  .icontent-article th { background: #1e293b; color: #ffffff; padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; }
  .icontent-article td { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
  .icontent-article .lead-hook { font-size: 1.4rem; color: #64748b; font-weight: 500; border-left: 3px solid #e2e8f0; padding-left: 1.5rem; margin: 2rem 0; }
</style>
<div class="icontent-article">
  ${text}
</div>`;
      finalContent = styles;
    }

    navigator.clipboard.writeText(finalContent);
    setCopyState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const websiteName = useMemo(() => {
    if (data.website_name === 'zizme') return 'zizme.com';
    if (data.website_name === 'xacot') return 'xacot.com';
    if (data.website_name === 'eallinfo') return 'eallinfo.com';
    return data.website_name || 'Upanel';
  }, [data.website_name]);

  const handlePostToUpanel = async () => {
    if (!upanelConfig || !upanelConfig.categoryId) {
      setPostError('Please select a category before posting.');
      setPostStatus('error');
      return;
    }
    
    setPostStatus('posting');
    setPostError('');
    
    try {
      await postArticleToUpanel(
        data,
        upanelConfig.categoryId,
        upanelConfig.subcategoryId,
        0 // Post as Draft
      );
      setPostStatus('success');
      setTimeout(() => setPostStatus('idle'), 5000);
    } catch (err: any) {
      setPostError(err.message || `Failed to post to ${websiteName}`);
      setPostStatus('error');
    }
  };

  const CopyButton = ({ text, id }: { text: string, id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      className={`absolute top-3 right-3 p-1.5 px-3 rounded-lg text-xs font-semibold transition-all border ${
        copyState[id] 
          ? 'bg-green-500/20 border-green-500/50 text-green-400' 
          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {copyState[id] ? 'Copied!' : 'Copy'}
    </button>
  );

  const AuditItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500 font-medium whitespace-nowrap">{label}</span>
      <span className="text-slate-300 text-right leading-tight">{value}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Left Column: Article Content */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/60 backdrop-blur-sm sticky top-20 z-40">
          <button 
            onClick={onBack}
            className="flex items-center text-sm text-slate-400 hover:text-white font-medium transition-colors group"
          >
            <div className="bg-slate-800 p-1.5 rounded-lg mr-2 group-hover:bg-slate-700 border border-slate-700">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            New Article
          </button>
          
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
               {wordCount.toLocaleString()} words
             </div>
             <button
               onClick={() => handleCopy(data.articleContent, 'full-article')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center shadow-lg ${
                 copyState['full-article'] 
                   ? 'bg-green-600 text-white shadow-green-900/20' 
                   : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
               }`}
            >
              {copyState['full-article'] ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied with Design!
                </>
              ) : (
                <>
                   <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Designed HTML
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 border border-blue-800/30 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center relative z-10 uppercase tracking-wide">
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             Research Intelligence
           </h3>
           <p className="text-sm text-slate-300 leading-relaxed relative z-10">{data.analysisSummary}</p>
        </div>

        {/* Main Content Render */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div 
            className="p-8 md:p-10 prose prose-lg prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-a:text-blue-400 prose-strong:text-white prose-code:text-blue-300 prose-pre:bg-slate-950 prose-th:text-slate-300 prose-td:text-slate-300 [&_div]:!bg-transparent [&_p]:!bg-transparent [&_span]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: data.articleContent }}
          />
        </div>

        {/* References/Sources */}
        {sources.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Citations & Data Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                >
                  {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: SEO Sidebar */}
      <div className="lg:col-span-1">
         <div className="sticky top-24 space-y-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Metadata Optimization</div>

            {/* Title */}
            <div className="bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-slate-700/80 relative group hover:border-blue-500/30 transition-all">
              <label className="text-xs font-bold text-blue-400 block mb-2">SEO Title</label>
              <div className="text-sm text-slate-100 font-medium leading-snug pr-8">{data.seoTitle}</div>
              <CopyButton text={data.seoTitle} id="title" />
            </div>

            {/* Slug */}
            <div className="bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-slate-700/80 relative group hover:border-blue-500/30 transition-all">
              <label className="text-xs font-bold text-blue-400 block mb-2">URL Slug</label>
              <div className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2.5 rounded-lg truncate pr-8 border border-slate-700">{data.seoSlug}</div>
               <CopyButton text={data.seoSlug} id="slug" />
            </div>

            {/* Meta Description */}
            <div className="bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-slate-700/80 relative group hover:border-blue-500/30 transition-all">
              <label className="text-xs font-bold text-blue-400 block mb-2">Meta Description</label>
              <div className="text-sm text-slate-300 leading-relaxed pr-8">{data.metaDescription}</div>
               <CopyButton text={data.metaDescription} id="desc" />
              <div className={`mt-3 text-xs text-right font-medium ${data.metaDescription.length > 160 ? 'text-red-400' : 'text-green-500'}`}>
                {data.metaDescription.length} / 160 chars
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-slate-700/80 relative group hover:border-blue-500/30 transition-all">
              <label className="text-xs font-bold text-blue-400 block mb-2">Meta Keywords</label>
              <div className="text-sm text-slate-300 pr-8">{data.metaKeywords}</div>
               <CopyButton text={data.metaKeywords} id="keywords" />
            </div>

            {/* Tags */}
            <div className="bg-slate-800/80 p-5 rounded-2xl shadow-sm border border-slate-700/80 relative group hover:border-blue-500/30 transition-all">
              <label className="text-xs font-bold text-blue-400 block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 pr-8">
                {data.websiteTags.map((tag, i) => (
                  <span key={i} className="bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-md text-xs border border-slate-600/50">
                    {tag}
                  </span>
                ))}
              </div>
              <CopyButton text={data.websiteTags.join(', ')} id="tags" />
            </div>

            {/* Post to Website Section */}
            {upanelConfig && (
              <div className="bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-indigo-500/20 space-y-4">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Publish to {websiteName}
                </div>
                
                {/* Category Selection if not set (e.g. from history) */}
                {(!upanelConfig.categoryId || upanelConfig.categoryId === 0) && categories.length > 0 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Select Main Category *</label>
                      <select
                        value={upanelConfig.categoryId || ''}
                        onChange={(e) => onCategoryChange?.(Number(e.target.value))}
                        className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500/50 focus:outline-none transition-all p-2.5 text-xs font-medium"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    {subcategories.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">Select Subcategory</label>
                        <select
                          value={upanelConfig.subcategoryId || ''}
                          onChange={(e) => onSubcategoryChange?.(Number(e.target.value))}
                          className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500/50 focus:outline-none transition-all p-2.5 text-xs font-medium"
                        >
                          <option value="">Select Subcategory</option>
                          {subcategories.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handlePostToUpanel}
                  disabled={postStatus === 'posting' || postStatus === 'success'}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-lg ${
                    postStatus === 'success'
                      ? 'bg-emerald-600 text-white'
                      : postStatus === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                  } disabled:opacity-70`}
                >
                  {postStatus === 'posting' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting to {websiteName}...
                    </>
                  ) : postStatus === 'success' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved as Draft!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Post to {websiteName}
                    </>
                  )}
                </button>
                
                {postStatus === 'error' && (
                  <div className="text-[10px] text-red-400 font-medium text-center animate-shake">
                    {postError}
                  </div>
                )}
              </div>
            )}

            {/* SEO Audit Section */}
            {data.seoAudit && (
              <div className="bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-emerald-500/20 space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  SEO Audit Report
                </div>
                <div className="space-y-3">
                  <AuditItem label="Title Length" value={data.seoAudit.titleLength} />
                  <AuditItem label="Power Words" value={data.seoAudit.powerWords} />
                  <AuditItem label="Keyword in Title" value={data.seoAudit.keywordInTitle} />
                  <AuditItem label="Meta Desc Length" value={data.seoAudit.metaDescLength} />
                  <AuditItem label="Keyword in Meta" value={data.seoAudit.keywordInMeta} />
                  <AuditItem label="Keyword in Slug" value={data.seoAudit.keywordInSlug} />
                  <AuditItem label="Keyword Density" value={data.seoAudit.keywordDensity} />
                  <AuditItem label="KW in 1st Para" value={data.seoAudit.keywordInFirstPara} />
                  <AuditItem label="Cannibalization" value={data.seoAudit.cannibalizationCheck} />
                  <AuditItem label="Readability" value={data.seoAudit.readabilityAudit} />
                  <AuditItem label="Transition Words" value={data.seoAudit.transitionWords} />
                  <AuditItem label="Internal Links" value={data.seoAudit.internalLinking} />
                  <AuditItem label="External Links" value={data.seoAudit.externalLinking} />
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};