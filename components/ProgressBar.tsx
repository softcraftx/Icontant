import React from 'react';

interface ProgressBarProps {
  progress: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  // Cap progress at 100
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full max-w-xl mx-auto mt-6 animate-fade-in">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-400">{label}</span>
        <span className="text-sm font-medium text-blue-400">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden border border-slate-600">
        <div 
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/30" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        {percentage < 20 && "Initializing research..."}
        {percentage >= 20 && percentage < 40 && " analyzing trends..."}
        {percentage >= 40 && percentage < 70 && "Writing deep-dive content..."}
        {percentage >= 70 && percentage < 90 && "Formatting HTML tables & structure..."}
        {percentage >= 90 && "Finalizing..."}
      </p>
    </div>
  );
};