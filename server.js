// server/server.js
require('dotenv').config()
const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')

// Create Express app
const app = express()

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}))

// Body parser middleware
app.use(express.json())

// models
const Instructor = require('./models/Instructor')
const Event      = require('./models/Event')
const Booking    = require('./models/Booking')

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(()=>console.log('Mongo connected'))
  .catch(e=>console.error(e))

// Middleware
app.use(cors())
app.use(express.json())

// log every incoming request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
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

// instructors
app.get('/api/instructors', async (req, res) =>
  res.json(await Instructor.find())
)
app.post('/api/instructors', async (req, res) =>
  res.json(await Instructor.create(req.body))
)

// events
app.get('/api/events', async (req, res) =>
  res.json(await Event.find().populate('instructor'))
)
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
  res.status(500).json({ message: 'Something went wrong!' })
})

app.listen(4000, ()=>console.log('▸ Server listening on :4000'))