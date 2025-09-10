import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateFlashcards(content: string, count: number = 5) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
    
    const prompt = `
    You are an expert tutor. 
Your task is to generate ${count} high-quality flashcards from the provided study content. 
The flashcards must help with topic revision and test deeper understanding of key concepts.

### Flashcard Requirements:
- Return ONLY valid JSON (no markdown, no explanations, no extra text).
- Each flashcard object must have:
  - "front": a clear and challenging question/prompt. 
  - "back": the correct answer or explanation. If code is relevant, include a concise, correct code snippet.
  - "difficulty": one of ["EASY", "MEDIUM", "HARD"] based on how challenging the question is.
- Questions should encourage active recall, not just memorization.
- Cover different angles: definitions, use cases, comparisons, pitfalls, reasoning, and examples.
- If the topic includes programming, databases, or algorithms, at least some cards should include short code examples in the answer.

### Input Content:
${content}

### Output Format (STRICT):
[
  {"front": "Question 1", "back": "Answer or explanation (with code if relevant)", "difficulty": "MEDIUM"},
  {"front": "Question 2", "back": "Answer or explanation", "difficulty": "EASY"}
]

`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up the response - remove markdown formatting if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    
    // Parse the JSON response
    const flashcards = JSON.parse(text)
    
    return flashcards
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw new Error('Failed to generate flashcards')
  }
}