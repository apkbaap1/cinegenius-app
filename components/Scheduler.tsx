
import React, { useState, useCallback } from 'react';
import { ScriptAnalysis, Language, ScheduleDay } from '../types';
import { UI_TEXT } from '../constants';
import { generateSchedule } from '../services/geminiService';
import { CalendarIcon, SparklesIcon } from './icons';

interface SchedulerProps {
  analysis: ScriptAnalysis;
  language: Language;
  schedule: ScheduleDay[] | null;
  setSchedule: (schedule: ScheduleDay[] | null) => void;
}

const Scheduler: React.FC<SchedulerProps> = ({ analysis, language, schedule, setSchedule }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSchedule(analysis, language);
      setSchedule(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [analysis, language, setSchedule]);

  return (
    <div>
      {!schedule && !isLoading && (
        <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">Shooting Schedule</h3>
            <p className="mt-1 text-sm text-gray-400">Generate an optimized shooting schedule based on locations and scenes.</p>
            <div className="mt-6">
                <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary"
                >
                    <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                    {UI_TEXT.generateSchedule[language]}
                </button>
            </div>
        </div>
      )}

      {isLoading && <p className="text-center py-12 text-lg">Generating schedule...</p>}
      {error && <p className="text-center py-12 text-red-400">{error}</p>}
      
      {schedule && (
        <div className="space-y-8">
            <h3 className="text-2xl font-semibold text-white">Shooting Schedule</h3>
          {schedule.map(day => (
            <div key={day.day} className="bg-base-200 border border-base-300 rounded-lg p-6">
              <h4 className="text-xl font-bold text-brand-primary">Day {day.day} <span className="text-sm font-normal text-gray-400 ml-2">{day.date}</span></h4>
              <p className="mt-1 text-sm text-gray-400 italic">{day.notes}</p>
              
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-base-300">
                    <tr>
                      <th className="py-2 pr-3 text-left text-sm font-semibold text-gray-300">Scene</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-gray-300">Setting</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-gray-300">Pages</th>
                      <th className="pl-3 py-2 text-left text-sm font-semibold text-gray-300">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.scenes.map(scene => (
                      <tr key={scene.sceneNumber} className="border-b border-base-300/50">
                        <td className="py-3 pr-3 text-sm font-medium text-white">{scene.sceneNumber}</td>
                        <td className="px-3 py-3 text-sm text-base-content">{scene.setting}</td>
                        <td className="px-3 py-3 text-sm text-base-content">{scene.pages}</td>
                        <td className="pl-3 py-3 text-sm text-base-content">{scene.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scheduler;
