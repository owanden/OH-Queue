# Office Hours Kiosk (oh-kiosk)

A modern queue management system for office hours, designed for both students and teaching assistants (TAs). Built with a monorepo architecture using pnpm workspaces.

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Package Manager**: pnpm workspaces
- **Data Storage**: In-memory (easily switchable to PostgreSQL)

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (install with `npm install -g pnpm`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oh-kiosk
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (optional for SMS):
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env with your Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
```

### Development

Start both frontend and backend in development mode:
```bash
pnpm dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

### Production

Build and start the application:
```bash
pnpm build
pnpm start
```

## Features

### For Students
- **Join Queue**: Enter phone number and optional topic
- **Anonymous Display**: Get a fun display name (e.g., "Blue Llama")
- **SMS Notifications**: Optional text alerts when it's your turn
- **Queue Position**: See your position in real-time
- **Privacy**: Phone numbers are hashed and never displayed

### For TAs
- **TA Management**: Add/remove yourself from active TA list
- **Queue Control**: Serve next student, mark as done, or drop no-shows
- **Real-time Updates**: Live queue display with student information
- **Student Management**: View topics and SMS consent status

### Core Behavior
- **Single Kiosk Screen**: Used by both students and TAs
- **Secure Storage**: Phone numbers are salted and hashed
- **Real-time Updates**: Queue updates every 2 seconds
- **Responsive Design**: Works on desktop and mobile devices


---
