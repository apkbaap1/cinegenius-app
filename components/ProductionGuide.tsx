
import React, { useState, useCallback, useMemo } from 'react';
import { ScriptAnalysis, Language, ProductionBible, Scene } from '../types';
import { UI_TEXT } from '../constants';
import { generateSceneProductionGuide } from '../services/geminiService';
import { BookOpenIcon, SparklesIcon } from './icons';

interface ProductionGuideProps {
  analysis: ScriptAnalysis;
  language: Language;
  sceneGuides: Map<number, ProductionBible>;
  setSceneGuides: React.Dispatch<React.SetStateAction<Map<number, ProductionBible>>>;
}

const ProductionGuide: React.FC<ProductionGuideProps> = ({ analysis, language, sceneGuides, setSceneGuides }) => {
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScene = useMemo(() => {
    if (!selectedSceneNumber) return null;
    return analysis.scenes.find(s => s.sceneNumber === selectedSceneNumber) || null;
  }, [selectedSceneNumber, analysis.scenes]);
  
  const currentGuide = useMemo(() => {
    if (!selectedSceneNumber) return null;
    return sceneGuides.get(selectedSceneNumber) || null;
  }, [selectedSceneNumber, sceneGuides]);

  const handleGenerateGuide = useCallback(async () => {
    if (!selectedScene) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSceneProductionGuide(selectedScene, language);
      setSceneGuides(prev => new Map(prev).set(selectedScene.sceneNumber, result));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate production guide for this scene.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedScene, language, setSceneGuides]);

  const renderSection = (title: string, data: any[], renderItem: (item: any, index: number) => React.ReactNode) => (
    <div>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.map(renderItem)}
        </div>
    </div>
  );
  
  return (
    <div>
      <div className="bg-base-200 p-4 rounded-lg border border-base-300 flex flex-col md:flex-row items-center gap-4">
        <label htmlFor="scene-select-guide" className="font-medium text-white">Select Scene:</label>
        <select
          id="scene-select-guide"
          onChange={(e) => {
            const sceneNum = e.target.value ? parseInt(e.target.value) : null;
            setSelectedSceneNumber(sceneNum);
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
        {selectedScene && !currentGuide && (
          <button
            onClick={handleGenerateGuide}
            disabled={isLoading}
            className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="-ml-1 mr-2 h-5 w-5"/>
            {isLoading ? 'Generating...' : `Generate Guide for Scene ${selectedScene.sceneNumber}`}
          </button>
        )}
      </div>

      {isLoading && <p className="text-center py-12 text-lg">Generating Production Guide for Scene {selectedSceneNumber}...</p>}
      {error && <p className="text-center py-12 text-red-400">{error}</p>}

      {!selectedScene && !isLoading && (
        <div className="text-center py-20">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">Scene Production Guide</h3>
            <p className="mt-1 text-sm text-gray-400">Select a scene to generate its production guide.</p>
        </div>
      )}
      
      {currentGuide && (
        <div className="mt-8 space-y-10">
            <h2 className="text-2xl font-bold text-center text-white">Production Guide for Scene {selectedSceneNumber}</h2>
            {renderSection(UI_TEXT.cameraLenses[language], currentGuide.camera, (item, index) => (
                <div key={index} className="bg-base-200 p-4 rounded-lg border border-base-300">
                    <h4 className="font-bold text-brand-primary">{item.recommendation}</h4>
                    <p className="mt-2 text-sm text-base-content">{item.reasoning}</p>
                </div>
            ))}
            {renderSection(UI_TEXT.artDepartment[language], currentGuide.art, (item, index) => (
                 <div key={index} className="bg-base-200 p-4 rounded-lg border border-base-300">
                    <h4 className="font-bold text-brand-primary">{item.prop}</h4>
                    <p className="mt-2 text-sm text-base-content">{item.description}</p>
                </div>
            ))}
            {renderSection(UI_TEXT.lighting[language], currentGuide.lighting, (item, index) => (
                 <div key={index} className="bg-base-200 p-4 rounded-lg border border-base-300">
                    <h4 className="font-bold text-brand-primary">{item.setup} <span className="text-sm font-normal text-gray-400 ml-2">({item.mood})</span></h4>
                    <p className="mt-2 text-sm text-base-content">{item.details}</p>
                </div>
            ))}
            {renderSection(UI_TEXT.costumes[language], currentGuide.costumes, (item, index) => (
                <div key={index} className="bg-base-200 p-4 rounded-lg border border-base-300">
                    <h4 className="font-bold text-brand-primary">{item.character}</h4>
                    <p className="mt-1 text-sm font-semibold text-gray-300">{item.costume}</p>
                    <p className="mt-2 text-sm text-base-content italic">Inspiration: {item.inspiration}</p>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProductionGuide;
