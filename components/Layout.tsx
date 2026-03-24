import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onLogoClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogoClick }) => {
  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={onLogoClick}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative bg-slate-900 rounded-lg p-1.5 border border-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              iContent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AI</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
             <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
               Pro SEO Suite
             </span>
          </div>
        </div>
      </header>
      
      <main className="flex-grow pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-slate-800/60 py-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} iContent AI. Powered by <span className="text-slate-400 font-medium">Google Gemini Pro</span>.
          </p>
        </div>
      </footer>
    </div>
  );
};