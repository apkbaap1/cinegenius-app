
import React, { useState } from 'react';
import { ScriptAnalysis, Language, ScheduleDay, Shot, ProductionBible, ContinuityAnalysis } from '../types';
import { UI_TEXT } from '../constants';
import SceneBreakdown from './SceneBreakdown';
import Scheduler from './Scheduler';
import Storyboard from './Storyboard';
import ProductionGuide from './ProductionGuide';
import Continuity from './Continuity';
import { ClapperboardIcon, CalendarIcon, CameraIcon, BookOpenIcon, DownloadIcon, ChainIcon } from './icons';
import { downloadAnalysisAsPDF } from '../utils/pdfGenerator';


interface DashboardProps {
  analysis: ScriptAnalysis;
  language: Language;
}

type Tab = 'breakdown' | 'scheduler' | 'storyboard' | 'guide' | 'continuity';

const Dashboard: React.FC<DashboardProps> = ({ analysis, language }) => {
  const [activeTab, setActiveTab] = useState<Tab>('breakdown');
  
  const [schedule, setSchedule] = useState<ScheduleDay[] | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [sceneGuides, setSceneGuides] = useState<Map<number, ProductionBible>>(new Map());
  const [continuityReport, setContinuityReport] = useState<ContinuityAnalysis | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
      setIsDownloading(true);
      try {
        await downloadAnalysisAsPDF({
          analysis,
          schedule,
          shots,
          sceneGuides,
          continuityReport,
        });
      } catch (error) {
          console.error("Failed to generate PDF", error);
          alert("There was an error creating the PDF. Please try again.");
      } finally {
        setIsDownloading(false);
      }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'breakdown':
        return <SceneBreakdown analysis={analysis} language={language} />;
      case 'scheduler':
        return <Scheduler analysis={analysis} language={language} schedule={schedule} setSchedule={setSchedule} />;
      case 'storyboard':
        return <Storyboard analysis={analysis} language={language} shots={shots} setShots={setShots} />;
      case 'guide':
        return <ProductionGuide analysis={analysis} language={language} sceneGuides={sceneGuides} setSceneGuides={setSceneGuides} />;
      case 'continuity':
        return <Continuity analysis={analysis} language={language} continuityReport={continuityReport} setContinuityReport={setContinuityReport} />;
      default:
        return null;
    }
  };

  const tabs = [
      { id: 'breakdown', label: UI_TEXT.sceneBreakdown[language], icon: ClapperboardIcon },
      { id: 'scheduler', label: UI_TEXT.scheduler[language], icon: CalendarIcon },
      { id: 'storyboard', label: UI_TEXT.storyboard[language], icon: CameraIcon },
      { id: 'guide', label: UI_TEXT.productionGuide[language], icon: BookOpenIcon },
      { id: 'continuity', label: UI_TEXT.continuity[language], icon: ChainIcon },
  ];

  return (
    <div>
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">{analysis.title}</h2>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-400">{analysis.logline}</p>
             <div className="mt-6">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-secondary hover:bg-brand-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <DownloadIcon className="-ml-1 mr-2 h-5 w-5"/>
                    {isDownloading ? 'Preparing PDF...' : UI_TEXT.downloadPdf[language]}
                </button>
            </div>
        </div>
      <div className="mb-8 border-b border-base-300">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
