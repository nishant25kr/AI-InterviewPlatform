import { WebSocket, WebSocketServer } from 'ws';
import { prisma } from './db';


const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_NAME = "gemini-3.1-flash-live-preview";
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

const wss = new WebSocketServer({ port: 8080 });
let geminiWS: WebSocket | null = null;

wss.on("listening", () => {
    console.log(`WebSocket server running on port ${wss.options.port}`);
});

wss.on('connection', function connection(ws) {
    console.log('WebSocket Client Connected');

    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        const msg = JSON.parse(data.toString());
        const parsedData = msg;
        console
.log('Received message from client:', parsedData);

        switch (msg.type) {
            case "init": {
                const interviewId = parsedData.payload.interviewId
                console.log(interviewId)
                if (!interviewId) {
                    console.log("invalid interviewID");
                    ws.send(JSON.stringify({
                        type: 'status',
                        payload: {
                            status: "Not able to connect",
                            message: "Invalid interview Id"
                        }
                    }))
                    return;
                }
                
                const res = await prisma.interview.findFirst({
                    where:{
                        id:interviewId
                    }
                })
                console.log("res",res)
                if (!res) {
                    console.log("invalid interviewID");
                    ws.send(JSON.stringify({
                        type: 'status',
                        payload: {
                            status: "Not able to connect",
                            message: "Invalid interview Id"
                        }
                    }))
                    return;
                }    
                    geminiWS = new WebSocket(WS_URL);
                    geminiWS.on('open', () => {
                        console.log("Connecting to gemini server...")
                        const setupMessage = {
                            setup: {
                                model: `models/${MODEL_NAME}`,
                            generationConfig: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                                    }
                                },
                            },
                            systemInstruction: {
                                parts: [{ text: 'You are a helpful assistant.' }]
                            }
                        }
                    };
                    geminiWS?.send(JSON.stringify(setupMessage))
                    safeSend(ws, { type: 'status', status: 'connected' });
                });

                geminiWS.on('message', async (event) => {
                    const raw = typeof event === 'string' ? event : event.toString();
                    const response = JSON.parse(raw);
                    const sc = response.serverContent;
                    if (sc?.modelTurn?.parts) {
                        for (const part of sc.modelTurn.parts) {
                            if (part.inlineData?.data) {
                                safeSend(ws, { type: 'audio', payload: { data: part.inlineData.data } });
                            }
                        }
                    }
                });

                geminiWS.on('error', (err) => {
                    console.error(`[ws] Gemini error for interview:`, err);
                    safeSend(ws, { type: 'error', message: 'Upstream Gemini connection error' });
                });

                geminiWS.on('close', () => {
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                });
                break;
            }

            case "audioMessage": {
                const audioMessage = parsedData.payload
                if (geminiWS && geminiWS.readyState === WebSocket.OPEN) {
                    geminiWS.send(JSON.stringify(audioMessage))
                }
                break;
            }

            default:
                break;

        }

    });

    ws.send('something');
});

function safeSend(ws: any, obj: any) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}