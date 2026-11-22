const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Express app initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth.js');
const eventsRoutes = require('./routes/events.js');
const bookingRoutes = require('./routes/booking.js');
const paymentRoutes = require('./routes/payment.js');

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Gatherr API');
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

module.exports = app;
