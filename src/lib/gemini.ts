import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateFlashcards(content: string, count: number = 5) {
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash-lite',
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                }
            })

        const prompt = `
You are an expert tutor. 
Your task is to generate ${count} high-quality flashcards from the provided study content. 
The flashcards must help with topic revision and test deeper understanding of key concepts.

### Flashcard Requirements:
- Return ONLY valid JSON (no markdown, no explanations, no extra text).
- Each flashcard object must have:
  - "front": a clear and challenging question/prompt
  - "back": the correct answer or explanation with proper markdown formatting
  - "difficulty": one of ["EASY", "MEDIUM", "HARD"] based on how challenging the question is
- Questions should encourage active recall, not just memorization.
- Cover different angles: definitions, use cases, comparisons, pitfalls, reasoning, and examples.
- Use markdown formatting in answers:
  - **Bold text** for emphasis
  - *Italic text* for definitions or key terms
  - \`inline code\` for short code snippets
  - Code blocks with language specification for longer code examples
  - Bullet points with - for lists
  - Numbered lists with 1. 2. 3. format

### Input Content:
${content}

### Output Format (STRICT):
[
  {"front": "What is the purpose of the useState hook in React?", "back": "The **useState** hook allows you to add *state* to functional components.\\n\\nBasic syntax:\\n\`\`\`javascript\\nconst [state, setState] = useState(initialValue);\\n\`\`\`\\n\\nKey points:\\n- Returns an array with current state and setter function\\n- Triggers re-render when state changes\\n- Can store any type of value", "difficulty": "MEDIUM"},
  {"front": "Question 2", "back": "Answer with **formatting**", "difficulty": "EASY"}
]

`

        const result = await model.generateContent(prompt)
        const response = result.response
        let text = response.text().trim()

        // Clean up the response - remove markdown formatting if present
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        
        // Remove any leading/trailing non-JSON content
        const jsonStart = text.indexOf('[')
        const jsonEnd = text.lastIndexOf(']')
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1)
        }

        // Parse the JSON response
        const flashcards = JSON.parse(text)
        
        // Validate the response structure
        if (!Array.isArray(flashcards)) {
            throw new Error('Invalid response format: expected array')
        }
        
        // Ensure each flashcard has required fields
        const validatedFlashcards = flashcards.map((card: any, index: number) => {
            if (!card.front || !card.back) {
                throw new Error(`Invalid flashcard at index ${index}: missing front or back`)
            }
            return {
                front: String(card.front).trim(),
                back: String(card.back).trim(),
                difficulty: card.difficulty || 'MEDIUM'
            }
        })

            return validatedFlashcards
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error)
            lastError = error as Error
            
            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
                continue
            }
        }
    }
    
    console.error('All attempts failed:', lastError)
    throw new Error('Failed to generate flashcards after multiple attempts')
}