import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { sendMessageToAssistant, startChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon } from './Icons';

const AiAssistant: React.FC = () => {
  const { t } = useLocalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startChat(); // Initialize the chat session when component mounts
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || loading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendMessageToAssistant(input, [...messages, userMessage]);
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMessageText = error.toString().includes("RESOURCE_EXHAUSTED")
          ? t('rateLimitError')
          : 'Sorry, I encountered an error. Please try again.';
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: errorMessageText }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-lg flex flex-col h-[70vh]">
      <div className="p-4 border-b border-base-300">
        <h3 className="text-xl font-bold text-content-100">{t('aiAssistant')}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-base-300 text-content-100 rounded-bl-none'}`}>
              <p className="text-sm">{msg.parts[0].text}</p>
            </div>
            {msg.role === 'user' && (
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-content-200" />
              </div>
            )}
          </div>
        ))}
         {loading && (
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                    <BotIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-md p-3 rounded-xl bg-base-300 text-content-100 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-content-200 rounded-full animate-pulse delay-75"></span>
                        <span className="w-2 h-2 bg-content-200 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-content-200 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center bg-base-100 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('askMeAnything')}
            className="flex-1 bg-transparent py-3 px-4 text-content-100 placeholder-base-300 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="m-2 bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors font-semibold disabled:bg-base-300 disabled:cursor-not-allowed"
          >
            {t('sendMessage')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;