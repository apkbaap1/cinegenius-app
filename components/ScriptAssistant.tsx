import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScriptAnalysis, Language, ConversationTurn } from '../types';
import { UI_TEXT } from '../constants';
import { askScriptQuestion } from '../services/geminiService';
import { BotIcon, SendIcon, SparklesIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface ScriptAssistantProps {
  analysis: ScriptAnalysis;
  language: Language;
  conversation: ConversationTurn[];
  setConversation: React.Dispatch<React.SetStateAction<ConversationTurn[]>>;
}

const ScriptAssistant: React.FC<ScriptAssistantProps> = ({ analysis, language, conversation, setConversation }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSend = useCallback(async (query?: string) => {
    const userMessage = query || input;
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setInput('');
    setConversation(prev => [...prev, { role: 'user', content: userMessage }, { role: 'loading', content: '' }]);

    try {
      const assistantResponse = await askScriptQuestion(analysis, userMessage, language);
      setConversation(prev => {
        const newConversation = [...prev];
        const loadingIndex = newConversation.findIndex(turn => turn.role === 'loading');
        if (loadingIndex !== -1) {
          newConversation[loadingIndex] = { role: 'assistant', content: assistantResponse };
        }
        return newConversation;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred.';
      setConversation(prev => {
        const newConversation = [...prev];
        const loadingIndex = newConversation.findIndex(turn => turn.role === 'loading');
        if (loadingIndex !== -1) {
          newConversation[loadingIndex] = { role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}` };
        }
        return newConversation;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, analysis, language, setConversation]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const exampleQueries = [
      `Which scenes does ${analysis.characters[0]?.name || 'the main character'} appear in?`,
      "What's a potential tagline for a movie poster?",
      "Summarize the main conflict based on the logline and characters.",
      "Are there any scenes that might be difficult to shoot? Why?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-22rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
        {conversation.length === 0 && (
           <div className="text-center py-12">
            <BotIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">Script Assistant</h3>
            <p className="mt-1 text-sm text-gray-400">Ask me anything about your script. I can help with character tracking, creative ideas, and production insights.</p>
          </div>
        )}
        {conversation.map((turn, index) => (
          <div key={index} className={`flex items-start gap-4 ${turn.role === 'user' ? 'justify-end' : ''}`}>
             {turn.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <BotIcon className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`p-3.5 rounded-lg max-w-xl shadow-md ${turn.role === 'user' ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-base-200 text-base-content rounded-bl-none'}`}>
                {turn.role === 'loading' ? (
                    <div className="flex items-center space-x-2">
                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                        <span className="text-sm">Assistant is thinking...</span>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                        <ReactMarkdown>{turn.content}</ReactMarkdown>
                    </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto pt-6">
         {conversation.length === 0 && !isLoading && (
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">{UI_TEXT.exampleQueries[language]}:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {exampleQueries.map((q, i) => (
                        <button key={i} onClick={() => handleSend(q)} className="text-left text-sm p-3 bg-base-200 hover:bg-base-300 rounded-md transition-colors text-gray-300">
                            "{q}"
                        </button>
                    ))}
                </div>
            </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={input}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleFormSubmit(e); }}
                onChange={(e) => setInput(e.target.value)}
                placeholder={UI_TEXT.askAnything[language]}
                className="flex-grow bg-base-300 border border-gray-600 rounded-md p-3 text-base-content focus:ring-2 focus:ring-brand-primary transition-shadow disabled:bg-base-300/50"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label={UI_TEXT.send[language]}
                className="inline-flex items-center justify-center p-3 border border-transparent rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                <SendIcon className="h-5 w-5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ScriptAssistant;
