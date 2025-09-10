# Memzi - AI Flashcard App

A modern flashcard application with AI-powered generation and spaced repetition, built with Next.js, shadcn/ui, and PostgreSQL.

## 🚀 Live Demo
[Visit Memzi](https://your-app-name.onrender.com) (Will be updated after deployment)

## ✨ Features

- 🧠 **AI-Powered Generation**: Generate flashcards automatically using Google Gemini AI
- 📚 **Deck Management**: Create, edit, and organize flashcards into decks
- 🔄 **Spaced Repetition**: Scientifically-proven SM-2 algorithm for optimal learning
- 🏷️ **Categories & Tags**: Organize decks with categories and tags
- 📱 **PWA Support**: Works offline and can be installed on mobile devices
- 🌙 **Dark Mode**: Built-in dark/light theme support
- 📊 **Progress Tracking**: Track your learning progress over time
- 🔐 **Authentication**: Secure user accounts with NextAuth.js

## Features

- 🧠 **AI-Powered Generation**: Generate flashcards automatically using Google Gemini AI
- 📚 **Deck Management**: Create, edit, and organize flashcards into decks
- 🔄 **Spaced Repetition**: Scientifically-proven SM-2 algorithm for optimal learning
- 📱 **PWA Support**: Works offline and can be installed on mobile devices
- 🌙 **Dark Mode**: Built-in dark/light theme support
- 📊 **Progress Tracking**: Track your learning progress over time
- 🔐 **Authentication**: Secure user accounts with NextAuth.js

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: Google Gemini API
- **PWA**: next-pwa for offline support
- **Deployment**: Render (with PostgreSQL addon)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd flashcard-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/flashcard_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
```

4. Set up the database:
```bash
npm run db:push
npm run db:generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Render

### 1. Database Setup

1. Create a PostgreSQL database on Render
2. Copy the database URL from Render dashboard

### 2. Web Service Setup

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure build and start commands:
   - **Build Command**: `npm install && npm run build && npm run db:push`
   - **Start Command**: `npm start`

### 3. Environment Variables

Add these environment variables in Render dashboard:

```
DATABASE_URL=<your-render-postgres-url>
NEXTAUTH_URL=<your-render-app-url>
NEXTAUTH_SECRET=<generate-a-secure-secret>
GEMINI_API_KEY=<your-gemini-api-key>
```

### 4. Deploy

Push to your main branch and Render will automatically deploy.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/session` - Get current session

### Decks
- `GET /api/decks` - Get user's decks
- `POST /api/decks` - Create new deck
- `PUT /api/decks/[id]` - Update deck
- `DELETE /api/decks/[id]` - Delete deck

### Flashcards
- `GET /api/decks/[id]/flashcards` - Get deck's flashcards
- `POST /api/decks/[id]/flashcards` - Create flashcard
- `PUT /api/flashcards/[id]` - Update flashcard
- `DELETE /api/flashcards/[id]` - Delete flashcard
- `POST /api/flashcards/[id]/progress` - Update study progress

### AI Generation
- `POST /api/generate` - Generate flashcards from content

## Database Schema

The app uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **decks**: Flashcard collections
- **flashcards**: Individual cards with front/back content
- **progress**: Spaced repetition tracking per card

## Spaced Repetition Algorithm

The app implements the SM-2 algorithm:

- **Quality Scale**: 1 (hard) to 5 (easy)
- **Ease Factor**: Adjusts based on performance
- **Intervals**: Dynamically calculated review dates
- **Status Tracking**: NEW → LEARNING → REVIEW → LEARNED

## PWA Features

- **Offline Support**: Cache critical resources
- **Install Prompt**: Add to home screen
- **Background Sync**: Sync when connection restored
- **Push Notifications**: Study reminders (optional)

## Optional Enhancements

### Immediate Improvements
- [ ] Bulk flashcard import/export
- [ ] Deck sharing between users
- [ ] Advanced statistics and analytics
- [ ] Custom study modes (cram, review only)
- [ ] Tags and categories for cards

### Advanced Features
- [ ] Collaborative decks
- [ ] Image and audio support
- [ ] Gamification (streaks, achievements)
- [ ] Integration with note-taking apps
- [ ] Advanced AI features (difficulty adjustment)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.