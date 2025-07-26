
import React, { useState, useCallback } from 'react';
import { ScriptAnalysis, Language, ContinuityAnalysis } from '../types';
import { UI_TEXT } from '../constants';
import { generateContinuityReport } from '../services/geminiService';
import { ChainIcon, SparklesIcon } from './icons';

interface ContinuityProps {
  analysis: ScriptAnalysis;
  language: Language;
  continuityReport: ContinuityAnalysis | null;
  setContinuityReport: (report: ContinuityAnalysis | null) => void;
}

const Continuity: React.FC<ContinuityProps> = ({ analysis, language, continuityReport, setContinuityReport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateContinuityReport(analysis, language);
      setContinuityReport(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate continuity report.');
    } finally {
      setIsLoading(false);
    }
  }, [analysis, language, setContinuityReport]);
  
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <ChainIcon className="mx-auto h-12 w-12 text-gray-500" />
      <h3 className="mt-2 text-xl font-semibold text-white">Continuity Check</h3>
      <p className="mt-1 text-sm text-gray-400">Analyze the script for continuity errors in characters, costumes, and editing.</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleGenerateReport}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary"
        >
          <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
          {UI_TEXT.generateContinuityReport[language]}
        </button>
      </div>
    </div>
  );

  const renderReport = () => {
    if (!continuityReport) return null;
    
    const { characterContinuity, costumeContinuity, editingContinuity } = continuityReport;

    if (characterContinuity.length === 0 && costumeContinuity.length === 0 && editingContinuity.length === 0) {
        return (
             <div className="text-center py-12 bg-base-200 rounded-lg">
                <ChainIcon className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-xl font-semibold text-white">No Continuity Issues Found</h3>
                <p className="mt-1 text-sm text-gray-400">The AI analysis did not detect any major continuity errors.</p>
            </div>
        )
    }

    return (
      <div className="space-y-10">
        <h3 className="text-2xl font-semibold text-white text-center">Continuity Report</h3>

        {characterContinuity.length > 0 && (
          <section>
            <h4 className="text-xl font-bold text-brand-primary mb-4">Character Continuity</h4>
            <div className="space-y-4">
              {characterContinuity.map((item, index) => (
                <div key={index} className="bg-base-200 border border-base-300 rounded-lg p-4">
                  <p className="font-semibold text-white">
                    <span className="text-gray-400">Scene {item.sceneNumber} - Character:</span> {item.character}
                  </p>
                  <p className="mt-2 text-base-content text-sm">{item.issue}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {costumeContinuity.length > 0 && (
          <section>
            <h4 className="text-xl font-bold text-brand-primary mb-4">Costume Continuity</h4>
            <div className="space-y-4">
              {costumeContinuity.map((item, index) => (
                <div key={index} className="bg-base-200 border border-base-300 rounded-lg p-4">
                  <p className="font-semibold text-white">
                    <span className="text-gray-400">Character:</span> {item.character} | <span className="text-gray-400">Scenes:</span> {item.sceneNumbers.join(', ')}
                  </p>
                  <p className="mt-2 text-base-content text-sm">{item.issue}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {editingContinuity.length > 0 && (
          <section>
            <h4 className="text-xl font-bold text-brand-primary mb-4">Editing & Shot Flow</h4>
            <div className="space-y-4">
              {editingContinuity.map((item, index) => (
                <div key={index} className="bg-base-200 border border-base-300 rounded-lg p-4">
                  <p className="font-semibold text-white">
                     <span className="text-gray-400">Between Scenes:</span> {item.sceneNumbers.join(' & ')}
                  </p>
                  <p className="mt-2 text-base-content text-sm"><span className="font-semibold text-gray-300">Issue:</span> {item.issue}</p>
                  <p className="mt-1 text-base-content text-sm"><span className="font-semibold text-gray-300">Suggestion:</span> {item.suggestion}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div>
      {!continuityReport && !isLoading && renderEmptyState()}
      {isLoading && <p className="text-center py-12 text-lg">Analyzing for continuity issues...</p>}
      {error && <p className="text-center py-12 text-red-400">{error}</p>}
      {continuityReport && renderReport()}
    </div>
  );
};

export default Continuity;
