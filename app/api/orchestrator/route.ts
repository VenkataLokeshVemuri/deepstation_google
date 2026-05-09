import { Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { getGeminiClient, getGeminiApiKey } from '@/lib/gemini-config';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const apiKey = getGeminiApiKey();

    if (!apiKey) {
       return NextResponse.json({ text: "It looks like the Gemini API key isn't configured yet! To chat with me and coordinate tasks, please click the Settings (gear icon) -> Secrets menu and set your `NEXT_PUBLIC_GEMINI_API_KEY`." });
    }

    const ai = getGeminiClient();

    const chat = ai.chats.create({
      model: 'gemini-flash-latest',
      config: {
        systemInstruction: `You are the Orchestrator Agent of a multi-agent system. You coordinate and manage 4 other agents: Library Agent (books), Grant Agent (funding), Job Agent (employment), and Housing Agent (renting/buying). 

Your job is to chat generally with the user, answer generic queries, and guide or refer them to the correct agent for specialized tasks based on their intent. You can use markdown to format your response.

You have tools to directly query these underlying agents. ALWAYS use the appropriate tool when the user asks for books, jobs, grants, or housing! DO NOT explain that you cannot search.`,
        tools: [{
            functionDeclarations: [
                {
                    name: 'queryLibrary',
                    description: 'Searches for books from the Open Library API.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING, description: 'The search query for books' }
                        },
                        required: ['q']
                    }
                },
                {
                    name: 'queryGrants',
                    description: 'Searches for grants and funding opportunities.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING, description: 'The search query for grants' }
                        },
                        required: ['q']
                    }
                },
                {
                    name: 'queryHousing',
                    description: 'Searches for housing and real estate properties.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING, description: 'The location or query for housing' }
                        },
                        required: ['q']
                    }
                },
                {
                    name: 'queryJobs',
                    description: 'Searches for job listings matching the query.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            q: { type: Type.STRING, description: 'The search query for jobs' }
                        },
                        required: ['q']
                    }
                }
            ]
        }]
      },
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const lastMessage = messages[messages.length - 1].content;

    // Call the model with history + current message
    let response = await chat.sendMessage({ message: lastMessage });

    // Handle tool calls if any
    let maxLoops = 3;
    while (response.functionCalls && response.functionCalls.length > 0 && maxLoops > 0) {
      maxLoops--;
      
      const toolResults = await Promise.all(response.functionCalls.map(async (call: any) => {
        const name = call.name;
        const args = call.args as any;
        let functionResult: any = {};

        const baseUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' 
          ? process.env.APP_URL 
          : 'http://localhost:3000';

        try {
          if (name === 'queryLibrary') {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(args.q)}&limit=5`);
            const data = await res.json();
            functionResult = { docs: data.docs?.slice(0, 5).map((d: any) => ({ title: d.title, author: d.author_name?.[0] })) };
          } 
          else if (name === 'queryGrants') {
            const res = await fetch(`${baseUrl}/api/grants?q=${encodeURIComponent(args.q)}`);
            functionResult = await res.json();
          }
          else if (name === 'queryHousing') {
            const res = await fetch(`${baseUrl}/api/housing?q=${encodeURIComponent(args.q)}`);
            functionResult = await res.json();
          }
          else if (name === 'queryJobs') {
            const res = await fetch(`${baseUrl}/api/jobs?q=${encodeURIComponent(args.q)}`);
            functionResult = await res.json();
          }
        } catch (err: any) {
          functionResult = { error: err.message };
        }

        return {
          functionResponse: {
            name: name!,
            response: functionResult
          }
        };
      }));

      response = await chat.sendMessage({ message: toolResults });
    }

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Orchestrator error:', error);
    return NextResponse.json({ error: 'ORCHESTRATOR_FAILED', message: error.message }, { status: 500 });
  }
}
