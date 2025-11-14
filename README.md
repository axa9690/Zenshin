# Zenshin - AI-Powered Eisenhower Matrix

A modern task management application using the Eisenhower Matrix with AI-powered task categorization.

## Features

- **Eisenhower Matrix**: Organize tasks by importance and urgency
- **AI-Powered Categorization**: Automatically categorize tasks using OpenAI GPT-4
- **Google Drive Sync**: Sync your tasks across devices (optional)
- **Task Backlog**: Store task ideas for later
- **Local Storage**: Works offline with local persistence
- **Smart Caching**: Fast responses for similar simple tasks

## AI Categorization

The app analyzes your task titles and descriptions to automatically assign them to the appropriate Eisenhower Matrix quadrant:

- **Important & Urgent**: Critical deadlines, crises, high-impact time-sensitive tasks
- **Important & Not Urgent**: Important goals, strategic planning, relationship building
- **Not Important & Urgent**: Interruptions, meetings, tasks others can do
- **Not Important & Not Urgent**: Time-wasters, trivial tasks, busywork

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Usage

1. **Add a Task**: Click "Add Task" and enter title and description
2. **AI Analysis**: The AI will automatically categorize your task (requires OpenAI API key)
3. **Manual Override**: You can always manually choose a different category
4. **Organize**: Tasks appear in the appropriate quadrant
5. **Track**: Use the date selector to view tasks for different days

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
