import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateFlashcards(content: string, count: number = 5) {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash-lite',
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.3,
                }
            })

            const prompt = `You are an expert tutor. 
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

            // More robust JSON extraction
            text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
            
            // Find JSON array boundaries
            let jsonStart = text.indexOf('[')
            let jsonEnd = text.lastIndexOf(']')
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No valid JSON array found in response')
            }
            
            text = text.substring(jsonStart, jsonEnd + 1)
            
            // Fix common JSON issues
            text = text
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .replace(/\n/g, '\\n') // Escape newlines
                .replace(/\r/g, '\\r') // Escape carriage returns
                .replace(/\t/g, '\\t') // Escape tabs
                .replace(/\\/g, '\\\\') // Escape backslashes
                .replace(/"/g, '\\"') // Escape quotes
                .replace(/\\"/g, '"') // Fix over-escaped quotes in JSON structure
                .replace(/\\"([^"]*)\\":/g, '"$1":') // Fix keys
                .replace(/:\\"([^"]*)\\"([,\]}])/g, ':"$1"$2') // Fix values

            let flashcards
            try {
                flashcards = JSON.parse(text)
            } catch (parseError) {
                // Fallback: try to extract individual objects
                const objectMatches = text.match(/\{[^{}]*\}/g)
                if (objectMatches) {
                    flashcards = objectMatches.map(match => {
                        try {
                            return JSON.parse(match)
                        } catch {
                            return null
                        }
                    }).filter(Boolean)
                } else {
                    throw parseError
                }
            }
            
            if (!Array.isArray(flashcards) || flashcards.length === 0) {
                throw new Error('Invalid response: expected non-empty array')
            }
            
            // Validate and clean flashcards
            const validatedFlashcards = flashcards
                .filter(card => card && typeof card === 'object')
                .map((card: any, index: number) => {
                    if (!card.front || !card.back) {
                        throw new Error(`Invalid flashcard at index ${index}: missing front or back`)
                    }
                    return {
                        front: String(card.front).trim().substring(0, 500), // Limit length
                        back: String(card.back).trim().substring(0, 1000),
                        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(card.difficulty) ? card.difficulty : 'MEDIUM'
                    }
                })
                .slice(0, count) // Ensure we don't exceed requested count

            if (validatedFlashcards.length === 0) {
                throw new Error('No valid flashcards generated')
            }

            return validatedFlashcards
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error)
            lastError = error as Error
            
            if (attempt < maxRetries) {
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
                continue
            }
        }
    }
    
    console.error('All attempts failed:', lastError)
    throw new Error(`Failed to generate flashcards after ${maxRetries + 1} attempts: ${lastError?.message}`)
}