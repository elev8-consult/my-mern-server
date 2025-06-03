// server/server.js
require('dotenv').config()
const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')

// Create Express app
const app = express()

// CORS Configuration
const allowedOrigins = [
  'https://my-mern-client-git-main-rami-abou-khalils-projects.vercel.app',
  'https://my-mern-client-rami-abou-khalils-projects.vercel.app',
  'https://my-mern-client-five.vercel.app',
  'https://book.aurastudio-lb.com',
  'http://localhost:3000'
];

// Configure CORS with more detailed error handling
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('Request from internal source (no origin)')
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      console.log('Allowed origin:', origin)
      callback(null, true)
    } else {
      console.warn('Blocked request from unauthorized origin:', origin)
      callback(new Error('Origin not allowed by CORS'))
    }
  },
  credentials: false, // Changed to false since we're using multiple origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
}))

// Body parser middleware
app.use(express.json())

// models
const Instructor = require('./models/Instructor')
const Event      = require('./models/Event')
const Booking    = require('./models/Booking')

// MongoDB Configuration
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/booking-system'

// Validate MongoDB URI
if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI not found in environment variables. Using default local URI.')
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected successfully')
})
.catch(err => {
  console.error('MongoDB connection error:', err)
  process.exit(1)
})

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Validation middleware for event creation
const validateEventData = (req, res, next) => {
  const { title, date, time, duration, instructor, maxSeats } = req.body;
  
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
  if (!date || isNaN(new Date(date).getTime())) return res.status(400).json({ message: 'Valid date is required' });
  if (!time?.match(/^\d{2}:\d{2}$/)) return res.status(400).json({ message: 'Time must be in HH:MM format' });
  if (!duration || duration < 15 || duration > 240) return res.status(400).json({ message: 'Duration must be between 15 and 240 minutes' });
  if (!instructor) return res.status(400).json({ message: 'Instructor is required' });
  if (!maxSeats || maxSeats < 1) return res.status(400).json({ message: 'Maximum seats must be at least 1' });
  
  next();
};

// Instructor routes
app.get('/api/instructors', async (req, res) => {
  try {
    const instructors = await Instructor.find().sort({ name: 1 });
    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Error fetching instructors' });
  }
});

app.post('/api/instructors', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const instructor = await Instructor.create({ name: name.trim() });
    res.status(201).json(instructor);
  } catch (error) {
    console.error('Error creating instructor:', error);
    res.status(500).json({ message: 'Error creating instructor' });
  }
});

// Get specific instructor by ID
app.get('/api/instructors/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' })
    }
    res.json(instructor)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// events
app.get('/api/events', async (req, res) => {
  try {
    const query = req.query.instructor ? { instructor: req.query.instructor } : {}
    const events = await Event.find(query)
      .populate('instructor')
      .lean()

    // Get bookings for these events
    const eventIds = events.map(e => e._id)
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .select('event name countryCode phone')
      .lean()

    // Group bookings by event
    const bookingsByEvent = bookings.reduce((acc, booking) => {
      acc[booking.event.toString()] = acc[booking.event.toString()] || []
      acc[booking.event.toString()].push(booking)
      return acc
    }, {})

    // Add bookings to each event
    const eventsWithBookings = events.map(event => ({
      ...event,
      attendees: bookingsByEvent[event._id.toString()] || [],
      booked: (bookingsByEvent[event._id.toString()] || []).length
    }))

    res.json(eventsWithBookings)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message })
  }
})

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('instructor')
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event' })
  }
})
app.get('/api/events/:id/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ event: req.params.id })
      .populate({
        path: 'event',
        select: 'title duration'
      })
      .sort({ createdAt: -1 }) // Most recent first
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' })
  }
})

// Delete booking and update event count
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const event = await Event.findById(booking.event);
    if (event) {
      event.booked = Math.max(0, event.booked - 1); // Ensure we don't go below 0
      await event.save();
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  }
})

app.post('/api/events', validateEventData, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.json(await event.populate('instructor'));
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
})

// bookings
app.post('/api/bookings', async (req, res) => {
  const { event: eventId, name, countryCode, phone } = req.body
  if (!name || !countryCode || !phone) {
    return res.status(400).send('Name, country code & phone required')
  }
  
  try {
    const ev = await Event.findById(eventId)
    if (!ev) return res.status(404).send('Event not found')
    if (ev.booked >= ev.maxSeats) return res.status(400).send('Full')
    
    // Create booking first
    await Booking.create({
      event: eventId,
      name,
      countryCode,
      phone: phone.toString() // Ensure phone is stored as string
    })
    
    // Update event booking count
    ev.booked = (ev.booked || 0) + 1
    await ev.save()
    
    res.json(ev)
  } catch (error) {
    console.error('Booking error:', error)
    res.status(500).send('Error creating booking')
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message 
  })
})

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Method not allowed handler
app.use((req, res, next) => {
  res.status(405).json({
    message: `Method ${req.method} is not allowed for ${req.url}`,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
  });
});

app.listen(4000, ()=>console.log('▸ Server listening on :4000'))