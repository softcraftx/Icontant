import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { MultiSelect } from './components/MultiSelect';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ProgressBar } from './components/ProgressBar'; 
import { COUNTRIES, DEFAULT_WEBSITES } from './constants';
import { WebsiteProfile, LoadingState, SeoResult, GroundingSource, Category, Subcategory } from './types';
import { generateSeoContent } from './services/geminiService';
import { fetchCategories, fetchSubcategories } from './services/upanelService';

const App: React.FC = () => {
  // State
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [viralHook, setViralHook] = useState('');
  const [gapAnalysis, setGapAnalysis] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [crossPromotion, setCrossPromotion] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [language, setLanguage] = useState<string>('English (US)');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['WW']);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>(DEFAULT_WEBSITES[0].id);
  
  // Upanel Specific State
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  
  // App Logic State
  const [view, setView] = useState<'generator' | 'history' | 'settings'>('generator');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [generatedData, setGeneratedData] = useState<SeoResult | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  // Sheets Data State
  const [sheetTopics, setSheetTopics] = useState<any[]>([]);
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Effects
  React.useEffect(() => {
    const website = DEFAULT_WEBSITES.find(w => w.id === selectedWebsiteId);
    if (website?.hasDynamicCategories) {
      loadCategories(selectedWebsiteId);
    } else {
      setCategories([]);
      setSubcategories([]);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }
    
    // Load topics from Google Sheets
    loadSheetTopics(selectedWebsiteId);
  }, [selectedWebsiteId]);

  const loadSheetTopics = async (websiteId: string) => {
    setIsSheetsLoading(true);
    setSheetTopics([]);
    setSelectedTopicId('');
    try {
      const response = await fetch(`/api/sheets/${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setSheetTopics(data);
      }
    } catch (err) {
      console.error('Failed to load sheet topics');
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleTopicSelect = (topicTitle: string) => {
    const topicData = sheetTopics.find(t => {
      const title = t.Title || t.title || t.Topic || t.topic || '';
      return title === topicTitle;
    });

    if (topicData) {
      setSelectedTopicId(topicTitle);
      
      // Helper to find value by case-insensitive key
      const getValue = (keys: string[]) => {
        const foundKey = Object.keys(topicData).find(k => 
          keys.some(searchKey => k.toLowerCase().replace(/\s/g, '') === searchKey.toLowerCase().replace(/\s/g, ''))
        );
        return foundKey ? topicData[foundKey] : '';
      };

      setTopic(getValue(['Title', 'Topic', 'TopicTitle']) || '');
      setPrimaryKeyword(getValue(['PrimaryKeyword', 'MainKeyword', 'FocusKeyword']) || '');
      setKeyword(getValue(['Keywords', 'SecondaryKeywords', 'LSIKeywords']) || '');
      setViralHook(getValue(['ViralHook', 'Hook', 'IntroHook']) || '');
      setGapAnalysis(getValue(['GapAnalysis', 'AnalysisGap', 'Gap']) || '');
    }
  };

  React.useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId, selectedWebsiteId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId(null);
    }
  }, [selectedCategoryId, selectedWebsiteId]);

  const loadCategories = async (websiteId: string) => {
    setIsCategoriesLoading(true);
    try {
      const cats = await fetchCategories(websiteId);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadSubcategories = async (parentId: number, websiteId: string) => {
    try {
      const subs = await fetchSubcategories(parentId, websiteId);
      setSubcategories(subs);
    } catch (err) {
      console.error('Failed to load subcategories');
    }
  };

  // Handlers
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !keyword.trim()) return;

    setStatus('analyzing');
    setGeneratedData(null);
    setErrorMessage('');
    setProgress(5); 

    const website = DEFAULT_WEBSITES.find(w => w.id === selectedWebsiteId) || DEFAULT_WEBSITES[0];
    
    // Fetch settings for Gemini API Key override
    let geminiApiKeyOverride = '';
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const allSettings = await settingsRes.json();
        const siteSettings = allSettings.find((s: any) => s.id === selectedWebsiteId);
        if (siteSettings?.gemini_api_key) {
          geminiApiKeyOverride = siteSettings.gemini_api_key;
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings for API key override');
    }

    try {
      const response = await generateSeoContent(
        topic,
        keyword,
        primaryKeyword,
        viralHook,
        gapAnalysis,
        affiliateLink,
        crossPromotion,
        customTone,
        selectedCountries.map(c => COUNTRIES.find(co => co.code === c)?.name || c),
        `${website.name} - ${website.description}`,
        website.tone,
        language,
        (partialContent, progressPercentage) => {
           if (status !== 'writing') setStatus('writing');
           setProgress(progressPercentage);
        },
        geminiApiKeyOverride
      );

      if (response.result) {
        const fullResult = {
          ...response.result,
          topic,
          website_name: website.id
        };
        setGeneratedData(fullResult);
        setSources(response.sources);
        setStatus('complete');
        setProgress(100);

        // Save to Database
        try {
          await fetch('/api/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteName: website.id,
              topic,
              focusKeyword: keyword,
              primaryKeyword,
              seoResult: fullResult,
              sources: response.sources
            })
          });
        } catch (dbErr) {
          console.error('Failed to save to history:', dbErr);
        }
      } else {
        let errorMsg = response.error || "Failed to generate content.";
        if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
          errorMsg = "⚠️ Gemini API Quota Exceeded (429). Please wait 1 minute and try again. Free tier has a 2-15 requests per minute limit.";
        }
        setErrorMessage(errorMsg);
        setStatus('error');
      }
    } catch (err: any) {
      let errorMsg = err.message || "An unexpected error occurred.";
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
        errorMsg = "⚠️ Gemini API Quota Exceeded (429). Please wait 1 minute and try again.";
      }
      setErrorMessage(errorMsg);
      setStatus('error');
    }
  };

  const handleSelectHistory = async (id: number) => {
    setStatus('analyzing');
    setView('generator');
    try {
      const response = await fetch(`/api/articles/${id}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      
      setTopic(data.topic);
      setKeyword(data.focusKeyword);
      setPrimaryKeyword(data.primaryKeyword);
      
      const websiteId = data.website_name || data.websiteName || '';
      setSelectedWebsiteId(websiteId);
      
      const fullResult = {
        ...data.seoResult,
        topic: data.topic,
        website_name: websiteId
      };
      
      setGeneratedData(fullResult);
      setSources(data.sources);
      setStatus('complete');
      setProgress(100);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  const handleLogoClick = () => {
    setView('generator');
    setStatus('idle');
    setGeneratedData(null);
    setProgress(0);
    setErrorMessage('');
  };

  return (
    <Layout onLogoClick={handleLogoClick}>
      {view === 'history' ? (
        <HistoryView 
          onSelect={handleSelectHistory}
          onBack={() => setView('generator')}
        />
      ) : view === 'settings' ? (
        <SettingsView onBack={() => setView('generator')} />
      ) : status === 'complete' && generatedData ? (
        <ResultView 
          data={generatedData} 
          sources={sources}
          onBack={() => {
             setStatus('idle');
             setProgress(0);
          }} 
          upanelConfig={{
            categoryId: selectedCategoryId || 0,
            subcategoryId: selectedSubcategoryId || undefined
          }}
          categories={categories}
          subcategories={subcategories}
          onCategoryChange={setSelectedCategoryId}
          onSubcategoryChange={setSelectedSubcategoryId}
        />
      ) : (
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={() => setView('settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => setView('history')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
          <div className="text-center mb-6 animate-fade-in-up">
             <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold tracking-widest uppercase mb-2">
               <span className="relative flex h-1 w-1">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-500"></span>
               </span>
               Human-Level Expert Writer
             </div>
             <h1 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
               Write Massive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">Personalized Articles</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Generate 2,500+ word deep-dives that sound like a human expert. 
              Native expressions, professional tone, and zero AI fluff.
            </p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-700/40 p-0.5 shadow-2xl relative transition-all duration-700 overflow-hidden">
            <div className="bg-slate-900/60 rounded-[1.4rem] p-6 md:p-8 overflow-hidden relative">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

              <form onSubmit={handleGenerate} className="space-y-10 relative z-10">
                
                {/* Section: Website Selection */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      Project Context
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEFAULT_WEBSITES.map((site) => {
                      const isSelected = selectedWebsiteId === site.id;
                      return (
                        <div 
                          key={site.id}
                          onClick={() => setSelectedWebsiteId(site.id)}
                          className={`group cursor-pointer relative rounded-2xl border p-4 transition-all duration-500 overflow-hidden ${
                            isSelected 
                            ? 'border-blue-500/50 bg-blue-600/5 shadow-[0_0_30px_rgba(37,99,235,0.1)] scale-[1.01]' 
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/40'
                          }`}
                        >
                          {isSelected && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>}
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-bold text-base tracking-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {site.name}
                            </span>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                               isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-700'
                            }`}>
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className={`text-[10px] leading-relaxed font-medium transition-colors duration-300 ${isSelected ? 'text-blue-200/70' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {site.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Category Selection */}
                  {DEFAULT_WEBSITES.find(w => w.id === selectedWebsiteId)?.hasDynamicCategories && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">
                          {DEFAULT_WEBSITES.find(w => w.id === selectedWebsiteId)?.name} Main Category *
                        </label>
                        <select
                          value={selectedCategoryId || ''}
                          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                          className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                          required
                        >
                          <option value="">{isCategoriesLoading ? 'Loading...' : 'Select Category'}</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">
                          {DEFAULT_WEBSITES.find(w => w.id === selectedWebsiteId)?.name} Subcategory
                        </label>
                        <select
                          value={selectedSubcategoryId || ''}
                          onChange={(e) => setSelectedSubcategoryId(Number(e.target.value))}
                          disabled={!selectedCategoryId || subcategories.length === 0}
                          className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium disabled:opacity-50"
                        >
                          <option value="">Select Subcategory</option>
                          {subcategories.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Google Sheets Topic Selection */}
                  {sheetTopics.length > 0 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Load Topic from Google Sheet (To Do)
                        {isSheetsLoading && <span className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin ml-2"></span>}
                      </label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicSelect(e.target.value)}
                        className="block w-full rounded-xl bg-slate-900/80 border border-emerald-500/30 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      >
                        <option value="">Select a Topic to Auto-fill</option>
                        {sheetTopics.map((item, idx) => {
                          const title = item.Title || item.title || item.Topic || item.topic || `Topic ${idx + 1}`;
                          const type = item.Type || item.type || '';
                          const displayLabel = type ? `(${type}) ${title}` : title;
                          return (
                            <option key={idx} value={title}>{displayLabel}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Language Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                     <div className="md:col-span-2">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setLanguage('English (US)')}
                            className={`group flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all duration-300 ${
                              language === 'English (US)'
                                ? 'bg-slate-800 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform">🇺🇸</span>
                            English (Native)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguage('Bangla (Bangladesh)')}
                            className={`group flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all duration-300 ${
                              language === 'Bangla (Bangladesh)'
                                ? 'bg-slate-800 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform">🇧🇩</span>
                            বাংলা (সহজ চলিত)
                          </button>
                        </div>
                     </div>
                     <div className="relative">
                       <MultiSelect
                          label="Target Regions"
                          options={COUNTRIES}
                          selectedValues={selectedCountries}
                          onChange={setSelectedCountries}
                        />
                     </div>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

                {/* Section: Content Strategy */}
                <div className="space-y-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Content Strategy
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Topic Title *</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={language.includes('Bangla') ? "যেমন: নতুন সিম অফার ২০২৫" : "e.g., Ultimate AI Productivity Guide"}
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Keywords</label>
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Keywords for the post body"
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Primary Keyword *</label>
                      <input
                        type="text"
                        value={primaryKeyword}
                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                        placeholder="Main focus keyword"
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Personal Angle / Viral Hook</label>
                      <input
                        type="text"
                        value={viralHook}
                        onChange={(e) => setViralHook(e.target.value)}
                        placeholder="Your unique insight or hook"
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Analysis Gap</label>
                      <input
                        type="text"
                        value={gapAnalysis}
                        onChange={(e) => setGapAnalysis(e.target.value)}
                        placeholder="What should we explain better?"
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Internal Reference Link</label>
                      <input
                        type="text"
                        value={crossPromotion}
                        onChange={(e) => setCrossPromotion(e.target.value)}
                        placeholder="Link to another post"
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Affiliate / Official Link</label>
                      <input
                        type="url"
                        value={affiliateLink}
                        onChange={(e) => setAffiliateLink(e.target.value)}
                        placeholder="https://..."
                        className="block w-full rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all p-3 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={status !== 'idle' && status !== 'error'}
                    className={`w-full group relative flex justify-center items-center py-4 px-6 rounded-2xl shadow-xl text-base font-black text-white transition-all duration-500 transform ${
                      status !== 'idle' && status !== 'error'
                        ? 'bg-slate-800 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.01] hover:shadow-blue-500/40 active:scale-[0.99]'
                    }`}
                  >
                    {status === 'idle' || status === 'error' ? (
                      <div className="flex items-center gap-2">
                        <span>Write Human-Level Authority Content</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-bold text-sm">
                          {status === 'analyzing' && 'Analyzing Search Intent...'}
                          {status === 'writing' && `Drafting (${Math.round(progress)}%)`}
                          {status === 'optimizing' && 'Applying Touch...'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Progress Visualizer */}
                {(status === 'analyzing' || status === 'writing' || status === 'optimizing') && (
                   <ProgressBar progress={progress} label={status === 'analyzing' ? 'Deep Researching Competitive Gaps...' : 'Expert Writing in Progress...'} />
                )}

                {status === 'error' && (
                  <div className="rounded-2xl bg-red-500/5 p-6 border border-red-500/20 backdrop-blur-md animate-shake">
                    <div className="flex gap-4">
                      <div className="bg-red-500/20 p-3 rounded-xl h-fit shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-1">Writer Interrupted</h3>
                        <p className="text-sm text-red-200/60 font-medium leading-relaxed mb-3">{errorMessage}</p>
                        <button 
                          onClick={() => setStatus('idle')}
                          className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          Retry Writing
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
          
          <div className="mt-12 text-center text-xs text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">
             Human-Level Intelligence v3.5 • Minimum 2500 Words Enforced
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;