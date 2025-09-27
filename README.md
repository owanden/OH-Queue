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

## API Endpoints

### TA Management
- `POST /api/tas` - Add a TA
- `DELETE /api/tas/:id` - Remove a TA
- `GET /api/tas` - Get active TAs

### Student Queue
- `POST /api/queue` - Add student to queue
- `GET /api/queue` - Get current queue
- `GET /api/queue/next` - Get next student
- `POST /api/queue/serve` - Serve next student
- `DELETE /api/queue/:studentId` - Drop student from queue

### Utility
- `GET /api/health` - Health check
- `POST /api/clear` - Clear all data (development only)

## Development

### Project Structure
```
oh-kiosk/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── data.ts         # In-memory data store
│   │   └── sms.ts          # Twilio SMS integration
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── TAModal.tsx
│   │   │   ├── StudentModal.tsx
│   │   │   ├── QueueDisplay.tsx
│   │   │   ├── StudentMode.tsx
│   │   │   └── TAMode.tsx
│   │   ├── App.tsx         # Main app component
│   │   ├── api.ts          # API client
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json            # Root package.json
├── pnpm-workspace.yaml     # pnpm workspace config
├── pnpm-lock.yaml
└── README.md
```

### Adding New Features

1. **Backend**: Add new endpoints in `backend/src/index.ts`
2. **Frontend**: Add new components in `frontend/src/components/`
3. **API Client**: Update `frontend/src/api.ts` for new endpoints
4. **Types**: Update type definitions in both `types.ts` files

### Database Migration

To switch from in-memory to PostgreSQL:

1. Install PostgreSQL dependencies:
```bash
cd backend
pnpm add pg @types/pg
```

2. Update `backend/src/data.ts` to use PostgreSQL instead of in-memory arrays
3. Add database connection and migration scripts

## Security Features

- **Phone Number Hashing**: Uses bcryptjs with salt for secure storage
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Server-side validation for all inputs
- **Anonymous Display**: Students are never identified by real names

## Deployment

### Environment Variables

Required for production:
```bash
NODE_ENV=production
PORT=3001
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
```

### Build Process

1. Build frontend: `pnpm --filter frontend build`
2. Build backend: `pnpm --filter backend build`
3. Start backend: `pnpm --filter backend start`
4. Serve frontend: Use a static file server or CDN

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in `vite.config.ts` and `backend/src/index.ts`
2. **SMS not working**: Check Twilio credentials and account balance
3. **Build errors**: Ensure all dependencies are installed with `pnpm install`

### Getting Help

- Check the console for error messages
- Verify all environment variables are set correctly
- Ensure Node.js version is 18 or higher
- Make sure pnpm is installed globally

---

Built for better office hours management
