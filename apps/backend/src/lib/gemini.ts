const API_KEY = process.env.API_KEY;
console.log(API_KEY);
const TEXT_MODEL = 'gemini-3.5-flash-lite'
export async function generateInterviewSummary(transcript: any){
    if (!API_KEY) throw new Error('GEMINI_API_KEY is not set');
    
    const transcriptText = transcript.transcript
    .map((t: any) => `${t.role === 'User' ? 'User' : 'Assistance'}: ${t.message}`)
    .join('\n');

    console.log(transcriptText)

  const prompt = [
    `Below is the transcript of a voice interview of the candidate.`,
    `Write a concise hiring-panel summary covering: strengths, weaknesses, communication quality,`,
    `and a final recommendation (Strong Hire / Hire / No Hire / Strong No Hire).`,
    `Then on a new final line output exactly: "SCORE: X" where X is an integer 0-10.`,
    ``,
    `Transcript:`,
    transcriptText || '(empty transcript)',
  ].join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini summary request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p : any) => p.text).join('') || '';

  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10))) : null;

  return { summary: text, score };
}