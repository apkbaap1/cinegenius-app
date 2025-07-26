
import React from 'react';
import { ScriptAnalysis, Language } from '../types';

interface SceneBreakdownProps {
  analysis: ScriptAnalysis;
  language: Language;
}

const SceneBreakdown: React.FC<SceneBreakdownProps> = ({ analysis }) => {
  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-semibold text-white mb-4">Scene List</h3>
        <div className="overflow-x-auto bg-base-200 rounded-lg border border-base-300">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-300/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Scene</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Setting</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Pages</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Characters</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {analysis.scenes.map((scene) => (
                <tr key={scene.sceneNumber}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{scene.sceneNumber}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content">{scene.setting}, {scene.timeOfDay}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content">{scene.pages}</td>
                  <td className="px-3 py-4 text-sm text-base-content">{scene.characters.join(', ')}</td>
                  <td className="px-3 py-4 text-sm text-base-content hidden md:table-cell max-w-md truncate">{scene.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-white mb-4">Character List</h3>
        <div className="overflow-x-auto bg-base-200 rounded-lg border border-base-300">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-300/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {analysis.characters.map((character) => (
                <tr key={character.name}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{character.name}</td>
                  <td className="px-3 py-4 text-sm text-base-content">{character.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SceneBreakdown;
