
import React, { useState, useCallback } from 'react';
import { ScriptAnalysis, Language } from './types';
import { parseScript } from './services/geminiService';
import ScriptInput from './components/ScriptInput';
import Dashboard from './components/Dashboard';
import { FilmIcon, SparklesIcon } from './components/icons';

export default function App() {
  const [script, setScript] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('English');

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleScriptAnalysis = useCallback(async (uploadedFile?: File) => {
    const fileToProcess = uploadedFile || file;
    const scriptToProcess = script;

    if (!scriptToProcess.trim() && !fileToProcess) {
      setError('A script must be provided either as text or as a file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      let result;
      if (fileToProcess) {
          const base64Data = await fileToBase64(fileToProcess);
          const filePart = {
              inlineData: {
                  data: base64Data,
                  mimeType: fileToProcess.type,
              },
          };
          result = await parseScript(filePart, language);
      } else {
        result = await parseScript(scriptToProcess, language);
      }
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during script analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [script, file, language]);
  
  const resetApp = () => {
      setScript('');
      setFile(null);
      setAnalysis(null);
      setIsLoading(false);
      setError(null);
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <header className="bg-base-200/50 backdrop-blur-sm border-b border-base-300 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FilmIcon className="w-8 h-8 text-brand-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">CineGenius</h1>
            </div>
            {analysis && (
                 <button
                    onClick={resetApp}
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-secondary transition-colors"
                >
                    New Project
                </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysis ? (
          <ScriptInput
            script={script}
            setScript={setScript}
            language={language}
            setLanguage={setLanguage}
            onAnalyze={handleScriptAnalysis}
            isLoading={isLoading}
            error={error}
            file={file}
            setFile={setFile}
          />
        ) : (
          <Dashboard analysis={analysis} language={language} />
        )}

        {isLoading && (
            <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
              <p className="text-xl text-white mt-4 font-semibold">AI is analyzing your script...</p>
              <p className="text-gray-400 mt-2">This may take a moment. Please wait.</p>
            </div>
        )}
      </main>

       <footer className="text-center py-6 text-sm text-gray-500 border-t border-base-200 mt-12">
            <p>Powered by Gemini API. Created for demonstration purposes.</p>
        </footer>
    </div>
  );
}
