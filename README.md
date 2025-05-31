# Class Booking System - Server

Backend server for the Class Booking System built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=4000

# MongoDB Configuration
MONGO_URI=your_mongodb_uri

# CORS Configuration
CLIENT_URL=your_client_url
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/elev8-consult/my-mern-server.git
cd my-mern-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Deployment

### Preparing for Production

1. Set up your MongoDB Atlas cluster
2. Set up your production environment variables
3. Update CORS settings if necessary

### Deployment Steps

1. Set up your production environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `CLIENT_URL`: Your frontend application URL
   - `NODE_ENV`: Set to 'production'

2. Build and start:
```bash
npm install
npm start
```

### Deployment Platforms

You can deploy this server to various platforms:

#### Heroku
1. Create a new Heroku app
2. Set up environment variables in Heroku dashboard
3. Deploy using Heroku Git or GitHub integration

#### Railway/Render
1. Connect your GitHub repository
2. Set up environment variables
3. The platform will automatically deploy your application

## API Documentation

### Endpoints

- `GET /api/events` - Get all available classes
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/instructors` - Get all instructors

## Error Handling

The server includes comprehensive error handling:
- Production-safe error messages
- 404 route handling
- Validation error handling
- MongoDB connection error handling

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run in production mode
npm start
```

## License

This project is licensed under the MIT License.