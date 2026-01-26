import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  showOperatorButton?: boolean;
};

const Chat: React.FC<{ lang?: 'ru' | 'uz' }> = ({ lang = 'ru' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  useEffect(() => {
    setIsApiKeySet(!!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key');
    
    // Приветственное сообщение
    const welcomeMessage: Message = {
      role: 'assistant',
      content: lang === 'ru' 
        ? 'Здравствуйте! Я ваш помощник по работе с Uzum Market. Задайте мне любой вопрос о работе платформы, и я постараюсь помочь, используя официальную документацию.'
        : 'Salom! Men sizning Uzum Market bilan ishlash bo\'yicha yordamchingizman. Menga platforma ishlashi haqida har qanday savol bering, men rasmiy hujjatlardan foydalanib yordam berishga harakat qilaman.'
    };
    setMessages([welcomeMessage]);
  }, [lang]);

  // Поиск релевантных секций в мануале
  const searchManual = async (query: string): Promise<string> => {
    try {
      // Поиск по ключевым словам в заголовках и контенте
      const { data, error } = await supabase
        .from('manual_sections')
        .select('*')
        .or(lang === 'ru' 
          ? `title_ru.ilike.%${query}%,content_ru.ilike.%${query}%`
          : `title_uz.ilike.%${query}%,content_uz.ilike.%${query}%`)
        .limit(3);

      if (error) throw error;

      if (!data || data.length === 0) {
        return '';
      }

      // Формируем контекст из найденных секций
      const context = data.map(section => {
        const title = lang === 'ru' ? section.title_ru : section.title_uz;
        const content = lang === 'ru' ? section.content_ru : section.content_uz;
        return `# ${title}\n${content?.substring(0, 2000) || ''}`;
      }).join('\n\n');

      return context;
    } catch (error) {
      console.error('Error searching manual:', error);
      return '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (!isApiKeySet) {
      const errorMessage: Message = { 
        role: 'assistant', 
        content: lang === 'ru' 
          ? 'Ключ API OpenAI не настроен. Обратитесь к администратору.' 
          : 'OpenAI API kaliti sozlanmagan. Ma\'murga murojaat qiling.',
        showOperatorButton: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    try {
      // Поиск релевантного контента в мануале
      const manualContext = await searchManual(input);

      const systemPrompt = lang === 'ru'
        ? `Ты - профессиональный помощник службы поддержки Uzum Market для продавцов. 

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе предоставленной документации
2. Если в документации нет ответа на вопрос, честно скажи об этом и предложи связаться с оператором
3. Отвечай кратко и по делу (максимум 3-4 предложения)
4. Используй дружелюбный тон
5. Если вопрос неясен, попроси уточнить

${manualContext ? `ДОКУМЕНТАЦИЯ:\n${manualContext}` : 'ВНИМАНИЕ: По данному запросу не найдена релевантная документация. Предложи пользователю связаться с оператором.'}`
        : `Siz Uzum Market sotuvchilari uchun professional yordam xizmati yordamchisisiz.

MUHIM QOIDALAR:
1. FAQAT taqdim etilgan hujjatlar asosida javob bering
2. Agar hujjatlarda savolga javob bo'lmasa, buni halol aytib, operator bilan bog'lanishni taklif qiling
3. Qisqa va aniq javob bering (maksimum 3-4 ta gap)
4. Do'stona ohangda gaplashing
5. Agar savol aniq bo'lmasa, aniqlashtrishni so'rang

${manualContext ? `HUJJATLAR:\n${manualContext}` : 'DIQQAT: Ushbu so\'rov bo\'yicha tegishli hujjatlar topilmadi. Foydalanuvchiga operator bilan bog\'lanishni taklif qiling.'}`;

      console.log('🔍 Sending request to OpenAI...');
      console.log('📋 Manual context length:', manualContext.length);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      console.log('✅ OpenAI response received');

      const responseText = completion.choices[0].message.content || '';
      
      // Проверяем, есть ли указание на отсутствие информации
      const shouldShowOperator = !manualContext || 
        responseText.toLowerCase().includes('оператор') ||
        responseText.toLowerCase().includes('operator') ||
        responseText.toLowerCase().includes('не могу') ||
        responseText.toLowerCase().includes('не нашел');

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: responseText,
        showOperatorButton: shouldShowOperator
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ Error generating response:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        type: error?.type
      });
      
      let errorText = lang === 'ru'
        ? 'Извините, произошла ошибка при обработке вашего запроса.'
        : 'Kechirasiz, so\'rovingizni qayta ishlashda xatolik yuz berdi.';
      
      // Более специфичные сообщения об ошибках
      if (error?.status === 401) {
        errorText = lang === 'ru'
          ? '🔑 Ошибка авторизации OpenAI. Проверьте API ключ.'
          : '🔑 OpenAI avtorizatsiya xatosi. API kalitini tekshiring.';
      } else if (error?.status === 429) {
        errorText = lang === 'ru'
          ? '⏱️ Превышен лимит запросов. Попробуйте через минуту.'
          : '⏱️ So\'rovlar limiti oshib ketdi. Bir daqiqadan keyin urinib ko\'ring.';
      } else if (error?.message?.includes('fetch')) {
        errorText = lang === 'ru'
          ? '🌐 Проблема с подключением к интернету. Проверьте соединение.'
          : '🌐 Internet bilan bog\'lanishda muammo. Ulanishni tekshiring.';
      }
      
      const errorMessage: Message = { 
        role: 'assistant', 
        content: errorText,
        showOperatorButton: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactOperator = () => {
    const operatorMessage: Message = {
      role: 'assistant',
      content: lang === 'ru'
        ? '📞 Свяжитесь с нашим оператором:\n\n✉️ Email: partners@uzum.uz\n📱 Telegram: @umarket_business_bot\n\nОператор ответит вам в ближайшее время!'
        : '📞 Operatorimiz bilan bog\'laning:\n\n✉️ Email: partners@uzum.uz\n📱 Telegram: @umarket_business_bot\n\nOperator tez orada javob beradi!'
    };
    setMessages(prev => [...prev, operatorMessage]);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#f5f5f5', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px' 
      }} ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div style={{ 
              display: 'flex', 
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '8px'
            }}>
              {msg.role === 'assistant' && (
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: '#6F00FF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '14px', 
                  marginRight: '8px',
                  flexShrink: 0
                }}>
                  🤖
                </div>
              )}
              <div style={{ 
                maxWidth: '70%', 
                padding: '12px 16px', 
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                backgroundColor: msg.role === 'user' ? '#6F00FF' : 'white', 
                color: msg.role === 'user' ? 'white' : '#333', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: '#ddd', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#333', 
                  fontSize: '14px', 
                  marginLeft: '8px',
                  flexShrink: 0
                }}>
                  👤
                </div>
              )}
            </div>
            {msg.showOperatorButton && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-start',
                paddingLeft: '40px',
                marginTop: '8px'
              }}>
                <button
                  onClick={handleContactOperator}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {lang === 'ru' ? '📞 Связаться с оператором' : '📞 Operator bilan bog\'laning'}
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: '#6F00FF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '14px', 
              marginRight: '8px',
              flexShrink: 0
            }}>
              🤖
            </div>
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '18px 18px 18px 4px', 
              backgroundColor: 'white', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <span style={{ color: '#6F00FF' }}>●</span>
              <span style={{ color: '#6F00FF', animation: 'blink 1s infinite' }}>●</span>
              <span style={{ color: '#6F00FF', animation: 'blink 1s infinite 0.2s' }}>●</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #e0e0e0', 
        backgroundColor: 'white', 
        display: 'flex', 
        gap: '8px'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !isLoading && handleSend()}
          placeholder={lang === 'ru' ? 'Введите вопрос...' : 'Savolingizni kiriting...'}
          disabled={isLoading}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            border: '1px solid #ccc', 
            borderRadius: '24px', 
            outline: 'none', 
            fontSize: '16px',
            opacity: isLoading ? 0.6 : 1
          }}
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading}
          style={{ 
            padding: '12px 20px', 
            border: 'none', 
            borderRadius: '24px', 
            backgroundColor: isLoading ? '#ccc' : '#6F00FF', 
            color: 'white', 
            cursor: isLoading ? 'not-allowed' : 'pointer', 
            fontSize: '16px', 
            fontWeight: 'bold'
          }}
        >
          {lang === 'ru' ? 'Отправить' : 'Yuborish'}
        </button>
      </div>
    </div>
  );
};

export default Chat;
