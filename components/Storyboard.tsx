
import React, { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { ScriptAnalysis, Language, Scene, Shot } from '../types';
import { UI_TEXT } from '../constants';
import { generateShotList, generateImageForShot } from '../services/geminiService';
import { CameraIcon, SparklesIcon } from './icons';

interface StoryboardProps {
  analysis: ScriptAnalysis;
  language: Language;
  shots: Shot[];
  setShots: Dispatch<SetStateAction<Shot[]>>;
}

const Storyboard: React.FC<StoryboardProps> = ({ analysis, language, shots, setShots }) => {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageGeneration = useCallback(async (shotsToProcess: Shot[], scene: Scene) => {
      for (let i = 0; i < shotsToProcess.length; i++) {
          const shot = shotsToProcess[i];
          try {
              const imageUrl = await generateImageForShot(shot, scene, language);
              setShots(prev => prev.map(s => s.shotNumber === shot.shotNumber ? { ...s, imageUrl, isLoadingImage: false } : s));
          } catch (err) {
              console.error(`Failed to generate image for shot ${shot.shotNumber}`, err);
              setShots(prev => prev.map(s => s.shotNumber === shot.shotNumber ? { ...s, imageUrl: 'error', isLoadingImage: false } : s));
          }
      }
  }, [language, setShots]);
  
  const handleGenerateStoryboard = useCallback(async () => {
    if (!selectedScene) return;
    setIsLoading(true);
    setError(null);
    setShots([]);
    
    try {
      const initialShots = await generateShotList(selectedScene, language);
      const shotsWithLoadingState = initialShots.map(s => ({ ...s, isLoadingImage: true }));
      setShots(shotsWithLoadingState);
      
      // Fire and forget image generation
      handleImageGeneration(shotsWithLoadingState, selectedScene);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate storyboard.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedScene, language, handleImageGeneration, setShots]);

  return (
    <div>
      <div className="bg-base-200 p-4 rounded-lg border border-base-300 flex flex-col md:flex-row items-center gap-4">
        <label htmlFor="scene-select" className="font-medium text-white">Select Scene:</label>
        <select
          id="scene-select"
          onChange={(e) => {
            const scene = analysis.scenes.find(s => s.sceneNumber === parseInt(e.target.value)) || null;
            setSelectedScene(scene);
            setShots([]);
            setError(null);
          }}
          className="w-full md:w-auto flex-grow bg-base-300 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
        >
          <option value="">{UI_TEXT.selectScene[language]}</option>
          {analysis.scenes.map(scene => (
            <option key={scene.sceneNumber} value={scene.sceneNumber}>
              Scene {scene.sceneNumber}: {scene.setting} - {scene.timeOfDay}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerateStoryboard}
          disabled={!selectedScene || isLoading}
          className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="-ml-1 mr-2 h-5 w-5"/>
          {UI_TEXT.generateStoryboard[language]}
        </button>
      </div>

      {isLoading && <p className="text-center py-12 text-lg">Generating shot list...</p>}
      {error && <p className="text-center py-12 text-red-400">{error}</p>}

      {!selectedScene && !isLoading && shots.length === 0 && (
        <div className="text-center py-20">
            <CameraIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">Storyboard Generator</h3>
            <p className="mt-1 text-sm text-gray-400">{UI_TEXT.selectScene[language]}</p>
        </div>
      )}

      {shots.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shots.map(shot => (
            <div key={shot.shotNumber} className="bg-base-200 border border-base-300 rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-w-16 aspect-h-9 bg-base-300 flex items-center justify-center">
                 {shot.isLoadingImage ? (
                    <div className="animate-pulse flex flex-col items-center justify-center text-gray-400">
                        <CameraIcon className="w-10 h-10" />
                        <p className="mt-2 text-sm">Generating Image...</p>
                    </div>
                 ) : shot.imageUrl === 'error' ? (
                     <div className="flex flex-col items-center justify-center text-red-400">
                        <p>Image Error</p>
                     </div>
                 ) : (
                    <img src={shot.imageUrl} alt={shot.description} className="w-full h-full object-cover" />
                 )}
              </div>
              <div className="p-4">
                <h4 className="text-lg font-bold text-white">Shot {shot.shotNumber}</h4>
                <p className="text-sm text-brand-secondary font-semibold">{shot.shotType} | {shot.lens}</p>
                <p className="mt-2 text-sm text-base-content">{shot.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Storyboard;
