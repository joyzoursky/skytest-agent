# Web AutoTest Agent

An autonomous web testing application powered by AI. Write test scenarios in plain English and watch the AI agent navigate, interact, and validate your web applications automatically.

## Features

- **Natural Language Testing**: Describe test steps in plain English
- **Real-time Streaming**: Watch tests execute with live logs and screenshots
- **AI-Powered**: Uses Midscene.js for intelligent web automation
- **No Code Required**: Just describe what you want to test

## Tech Stack

- **Next.js 16** - React framework
- **Midscene.js** - AI-powered web automation
- **Playwright** - Browser automation
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenRouter API key (or OpenAI API key)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your API keys:
```
# AI Configuration
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=your_api_key_here
MIDSCENE_MODEL_NAME=google/gemini-2.5-flash

# Authgear Configuration
NEXT_PUBLIC_AUTHGEAR_CLIENT_ID=your_client_id
NEXT_PUBLIC_AUTHGEAR_ENDPOINT=your_endpoint
NEXT_PUBLIC_AUTHGEAR_REDIRECT_URI=http://localhost:3000/auth-redirect
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## Usage

1. **Enter Target URL**: The website you want to test
2. **Credentials** (optional): Username and password if login is required
3. **Agent Instructions**: Describe your test scenario in plain English

Example:
```
Login with the provided credentials.
Navigate to the products page.
Add the first item to cart.
Verify the item appears in the cart.
```

4. Click **Deploy Test Agent** and watch it execute!

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── run-test/      # API endpoint for running tests
│   │   ├── components/         # React components
│   │   │   ├── TestForm.tsx   # Test configuration form
│   │   │   └── ResultViewer.tsx # Test results display
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx          # Home page
│   └── ...
├── public/                     # Static assets
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## License

MIT
