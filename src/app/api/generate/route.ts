import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { apiKey, testLabel, section, count } = await req.json()

    if (!apiKey || !testLabel || !section || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sectionInstructions: Record<string, string> = {
      'Error Recognition':
        'For Error Recognition: write a complete sentence where exactly 4 parts are labeled (A), (B), (C), (D). One part has a grammatical error. Options must be exactly ["A", "B", "C", "D"]. Answer is 0-based index of the wrong part.',
      'Grammar':
        'For Grammar: sentence-completion style. Provide a sentence with a blank and 4 grammatically-focused options.',
      'Grammar & Vocabulary':
        'For Grammar & Vocabulary: mix 50% sentence completion and 50% vocabulary-in-context questions.',
      'Structure & Written Expression':
        'For Structure & Written Expression: mix sentence completion and underlined-error identification.',
      'Incomplete Sentences':
        'For Incomplete Sentences: provide a sentence with a blank and 4 options to complete it.',
      'Writing':
        'For Writing: provide a short writing prompt or sentence-improvement question with 4 options.',
    }

    const extraInstruction = sectionInstructions[section] ?? ''

    const prompt = `You are a ${testLabel} exam expert. Generate exactly ${count} multiple-choice practice questions for the "${section}" section of the ${testLabel} exam.

${extraInstruction}

Return ONLY a valid JSON array, no markdown, no preamble, no explanation. Format:
[{"section":"${section}","passage":"short reading or dialogue text if needed for this section type, otherwise empty string","question":"the question text","options":["A. ...","B. ...","C. ...","D. ..."],"answer":0,"explanation":"penjelasan singkat dan jelas dalam Bahasa Indonesia mengapa jawaban tersebut benar, termasuk pembahasan grammar/kosakata jika relevan"}]

Strict rules:
- answer is the 0-based index (0, 1, 2, or 3) of the correct option
- For Reading/Listening: include a 3–5 sentence authentic passage or dialogue
- For Grammar/Vocabulary: passage can be empty string
- Difficulty must be authentic ${testLabel} exam level
- Questions and answer options in English only
- Explanation field in Bahasa Indonesia only
- Return ONLY the raw JSON array — no \`\`\`json, no extra text`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json(
        { error: err.error?.message ?? 'Groq API error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('[')
    if (start === -1) throw new Error('No JSON array found in response')
    const questions = JSON.parse(clean.slice(start))

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Empty questions array returned')
    }

    return NextResponse.json({ questions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
