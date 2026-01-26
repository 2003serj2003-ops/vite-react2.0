import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    // Load all content from Supabase
    const loadContext = async () => {
      const sections = await supabase.from('sections').select('title_ru, title_uz');
      const cards = await supabase.from('cards').select('title_ru, title_uz, body_ru, body_uz');
      const faq = await supabase.from('faq').select('question_ru, question_uz, answer_ru, answer_uz');
      const news = await supabase.from('news').select('title_ru, title_uz, body_ru, body_uz');
      const manual = await supabase.from('manual_sections').select('title, content');

      const allContent = [
        ...(sections.data || []).map(s => `${s.title_ru} ${s.title_uz}`),
        ...(cards.data || []).map(c => `${c.title_ru} ${c.title_uz} ${c.body_ru} ${c.body_uz}`),
        ...(faq.data || []).map(f => `${f.question_ru} ${f.question_uz} ${f.answer_ru} ${f.answer_uz}`),
        ...(news.data || []).map(n => `${n.title_ru} ${n.title_uz} ${n.body_ru} ${n.body_uz}`),
        ...(manual.data || []).map(m => `${m.title} ${m.content}`)
      ].join('\n');

      setContext(allContent);
    };
    loadContext();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are a support bot for Uzum app. Use the following manual content to answer questions in Russian or Uzbek: ${context}` },
        userMessage
      ]
    });

    const assistantMessage = { role: 'assistant' as const, content: completion.choices[0].message.content || '' };
    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ height: '400px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #ccc', padding: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px' }}>
            <strong>{msg.role === 'user' ? 'Вы:' : 'Бот:'}</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSend()}
        placeholder="Введите вопрос..."
        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
      />
      <button onClick={handleSend} style={{ width: '100%', padding: '8px' }}>Отправить</button>
    </div>
  );
};

export default Chat;