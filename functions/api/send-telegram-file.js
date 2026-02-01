export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle /api/send-telegram-file route
    if (url.pathname === '/api/send-telegram-file' && request.method === 'POST') {
      try {
        const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
        
        if (!TELEGRAM_BOT_TOKEN) {
          return new Response(
            JSON.stringify({ error: 'Bot token not configured' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { chatId, fileName, fileContent, mimeType, caption } = await request.json();

        if (!chatId || !fileName || !fileContent) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('chat_id', chatId.toString());
        
        // Create blob from file content
        let blob;
        if (mimeType === 'application/pdf') {
          // Decode base64 to binary
          const binaryString = atob(fileContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } else {
          // JSON or text
          blob = new Blob([fileContent], { type: mimeType || 'application/json' });
        }
        
        formData.append('document', blob, fileName);
        
        if (caption) {
          formData.append('caption', caption);
        }

        // Send document to Telegram
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
          console.error('Telegram API error:', telegramData);
          return new Response(
            JSON.stringify({ error: telegramData.description || 'Failed to send document' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: telegramData }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (error) {
        console.error('Error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // For all other routes, return 404
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
