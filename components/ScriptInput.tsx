
import React, { useRef } from 'react';
import { Language } from '../types';
import { UI_TEXT, LANGUAGES } from '../constants';
import { SparklesIcon, UploadIcon, FileTextIcon, XCircleIcon } from './icons';

interface ScriptInputProps {
  script: string;
  setScript: (script: string) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  onAnalyze: (uploadedFile?: File) => void;
  isLoading: boolean;
  error: string | null;
  file: File | null;
  setFile: (file: File | null) => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ script, setScript, language, setLanguage, onAnalyze, isLoading, error, file, setFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedMimeTypes = ['application/pdf'];
      const allowedExtensions = ['pdf'];
      
      const fileType = selectedFile.type;
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (allowedMimeTypes.includes(fileType) || (fileExtension && allowedExtensions.includes(fileExtension))) {
        setFile(selectedFile);
        setScript('');
        onAnalyze(selectedFile); // Analyze immediately
      } else {
        alert('Invalid file type. Please upload a PDF document (.pdf).');
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
    if (e.target.value) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Turn Your Script into a Blueprint</h2>
          <p className="mt-4 text-lg text-gray-400">
              Paste your script below or upload a file. Our AI will break it down into scenes, create a schedule, and generate storyboards.
          </p>
      </div>

      <div className="mt-10 bg-base-200 p-6 rounded-xl shadow-2xl border border-base-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className='md:col-span-3'>
              <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">
                {UI_TEXT.language[language]}
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full bg-base-300 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
          </div>
        </div>

        <textarea
          value={script}
          onChange={handleTextChange}
          placeholder={UI_TEXT.pasteScript[language]}
          className="w-full h-60 bg-base-300 border border-gray-600 rounded-md p-4 text-base-content focus:ring-2 focus:ring-brand-primary font-mono transition-shadow disabled:bg-base-300/50 disabled:cursor-not-allowed"
          disabled={isLoading || !!file}
        />

        <div className="my-4 flex items-center text-sm text-gray-500">
            <div className="flex-grow border-t border-base-300"></div>
            <span className="flex-shrink mx-4 uppercase font-semibold">Or</span>
            <div className="flex-grow border-t border-base-300"></div>
        </div>

        <div>
            {file ? (
                <div className="flex items-center justify-between bg-base-300 p-3 rounded-md border border-brand-primary">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileTextIcon className="w-6 h-6 text-brand-primary flex-shrink-0"/>
                        <p className="font-medium text-white truncate" title={file.name}>{file.name}</p>
                    </div>
                    <button onClick={handleClearFile} disabled={isLoading} className="ml-4 text-gray-400 hover:text-white disabled:cursor-not-allowed flex-shrink-0">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
            ) : (
                 <button
                    type="button"
                    onClick={triggerFileUpload}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-6 py-4 border-2 border-dashed border-base-300 text-base font-medium rounded-md text-gray-400 hover:text-white hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UploadIcon className="w-5 h-5 mr-3" />
                    Upload Script File (.pdf)
                </button>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,application/pdf"
                disabled={isLoading}
            />
        </div>
        
        {error && <p className="mt-4 text-red-400">{error}</p>}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onAnalyze()}
            disabled={isLoading || (!script.trim() && !file)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="-ml-1 mr-3 h-5 w-5"/>
            {isLoading ? 'Analyzing...' : UI_TEXT.analyzeScript[language]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptInput;
