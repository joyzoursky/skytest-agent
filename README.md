# 🤖 Web AutoTest Agent

An autonomous web testing application powered by AI. Write test scenarios in plain English and watch the AI agent navigate, interact, and validate your web applications automatically.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Prisma](https://img.shields.io/badge/Prisma-7.0-blue)
![Midscene.js](https://img.shields.io/badge/Midscene.js-0.30-orange)

## ✨ Features

- **Natural Language Testing**: Describe test steps in plain English (e.g., "Click the login button and verify the dashboard header").
- **Real-time Execution**: Watch the AI agent work in real-time with live logs and visual snapshots.
- **AI-Powered Automation**: Leverages Midscene.js for intelligent element interaction and visual verification.
- **Project Management**: Organize your test cases into projects and track historical test runs.
- **Modern UI**: A sleek, responsive dashboard built with Tailwind CSS.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **AI Agent**: [Midscene.js](https://midscenejs.com/)
- **Browser Automation**: [Playwright](https://playwright.dev/)
- **Database**: [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Authgear](https://www.authgear.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- An API Key for an LLM provider (OpenRouter, OpenAI, etc.)
- An Authgear account (or configure your own auth provider)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/web-autotest-agent.git
   cd web-autotest-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   *Required Keys:* `OPENAI_API_KEY`, `NEXT_PUBLIC_AUTHGEAR_CLIENT_ID`, `NEXT_PUBLIC_AUTHGEAR_ENDPOINT`.

4. **Initialize the Database**:
   ```bash
   npx prisma db push
   ```

### Running the Application

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start testing.

## 📝 Usage Guide

1. **Create a Project**: Group your test cases by application or feature set.
2. **Add a Test Case**:
   - **URL**: The starting page for the test.
   - **Prompt**: Your instructions in plain English.
   - **Credentials**: (Optional) Provide login info if needed for the test flow.
3. **Execute**: Click **Deploy Test Agent** and monitor the results in the interactive viewer.

### Example Prompt
```text
1. Login with the user credentials.
2. Search for "Mechanical Keyboard" in the search bar.
3. Click on the first result.
4. Verify that the product price is visible.
```

## 🔒 Security & Privacy

- **API Keys**: Never commit your `.env.local` file. It is included in `.gitignore` by default.
- **Password Safety**: Test case passwords are stored in the database. For security, do not use real-world sensitive passwords for automated tests.
- **Data Persistence**: By default, data is stored in a local `dev.db` file.

## 📂 Project Structure

- `src/app/`: Next.js pages and API routes.
- `src/components/`: Reusable React components.
- `src/lib/`: Shared utilities and Prisma client.
- `prisma/`: Database schema and migrations.
- `midscene_run/`: Reports and logs from AI test runs (ignored by git).

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
