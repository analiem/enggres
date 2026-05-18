import { NextRequest, NextResponse } from 'next/server'

// Attempt to salvage valid question objects from a truncated JSON string
function repairAndParseJSON(raw: string): unknown[] {
  const clean = raw.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('[')
  if (start === -1) throw new Error('No JSON array found in response')

  const slice = clean.slice(start)

  // Try clean parse first
  try {
    const parsed = JSON.parse(slice)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // JSON is truncated — salvage complete objects
  }

  // Salvage: extract complete {...} objects from the broken array
  const salvaged: unknown[] = []
  let depth = 0
  let objStart = -1

  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i]
    if (ch === '{') {
      if (depth === 0) objStart = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && objStart !== -1) {
        try {
          const obj = JSON.parse(slice.slice(objStart, i + 1))
          // Validate it has required fields
          if (
            obj &&
            typeof obj.question === 'string' &&
            Array.isArray(obj.options) &&
            obj.options.length === 4 &&
            typeof obj.answer === 'number'
          ) {
            salvaged.push(obj)
          }
        } catch {
          // skip malformed object
        }
        objStart = -1
      }
    }
  }

  if (salvaged.length === 0) throw new Error('Could not parse any valid questions from response')
  return salvaged
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, testLabel, section, count } = await req.json()

    if (!apiKey || !testLabel || !section || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sectionInstructions: Record<string, string> = {
      'Error Recognition':
        'For Error Recognition: write a sentence with 4 parts labeled (A)(B)(C)(D). One part has a grammatical error. Options must be exactly ["A", "B", "C", "D"]. Answer is 0-based index of the wrong part.',
      'Grammar':
        'For Grammar: sentence-completion. Provide a sentence with a blank and 4 grammar-focused options.',
      'Grammar & Vocabulary':
        'For Grammar & Vocabulary: mix sentence completion and vocabulary-in-context questions.',
      'Structure & Written Expression':
        'For Structure & Written Expression: mix sentence completion and error identification.',
      'Incomplete Sentences':
        'For Incomplete Sentences: sentence with a blank and 4 options.',
      'Writing':
        'For Writing: sentence-improvement question with 4 options.',
      'Listening':
        'For Listening: include a short 2–3 sentence dialogue as the passage. Question based on the dialogue.',
      'Listening Comprehension':
        'For Listening Comprehension: include a short 2–3 sentence dialogue as the passage. Question based on the dialogue.',
      'Listening (Part 1–4)':
        'For Listening: include a short 2–3 sentence dialogue or announcement as the passage.',
      'Reading & Grammar (Part 5–7)':
        'For Reading & Grammar: mix incomplete sentences and short reading passages.',
    }

    const extraInstruction = sectionInstructions[section] ?? ''

    // Compact prompt to minimize output tokens
    const prompt = `You are a ${testLabel} exam expert. Generate exactly ${count} multiple-choice questions for the "${section}" section.

${extraInstruction}

Return ONLY a raw JSON array. No markdown, no explanation, no extra text. Each item:
{"section":"${section}","passage":"2-3 sentence text if needed, else empty","question":"question text","options":["A. ...","B. ...","C. ...","D. ..."],"answer":0,"explanation":"penjelasan singkat dalam Bahasa Indonesia"}

Rules:
- answer = 0-based index of correct option (0,1,2,3)
- Keep passages SHORT (2-3 sentences max) to save tokens
- Questions and options in English, explanation in Bahasa Indonesia
- Output ONLY the JSON array, nothing else`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 3000,   // enough for 5 questions with headroom
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      const msg = err.error?.message ?? 'Groq API error'
      const isRateLimit = response.status === 429 || msg.toLowerCase().includes('rate')
      return NextResponse.json(
        { error: isRateLimit ? `rate limit: ${msg}` : msg },
        { status: response.status }
      )
    }

    const data = await response.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''

    // Use JSON repair to handle truncated responses
    const questions = repairAndParseJSON(raw)

    if (questions.length === 0) {
      throw new Error('Empty questions array returned')
    }

    return NextResponse.json({ questions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
