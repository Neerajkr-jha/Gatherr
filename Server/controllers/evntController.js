const Event = require('../models/Event.js');

// Get all events
const getAllEvents = async (req, res) => {
    try {
        const filters = {};

        // Filters based on query parameters
        if (req.query.category) {
            filters.category = req.query.category;
        }

        if (req.query.location) {
            filters.location = req.query.location;
        }

        const events = await Event.find(filters);
        res.status(200).json(events);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get event by ID
const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create event
const createEvent = async (req, res) => {
    const {
        title,
        description,
        date,
        location,
        category,
        totalSeats,
        ticketPrice,
        imageUrl
    } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats,
            ticketPrice,
            image: imageUrl,
            createdBy: req.user._id
        });

        await newEvent.save();

        res.status(201).json(newEvent);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update event
const updateEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            imageUrl
        } = req.body;

        const updateData = {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice
        };

        if (imageUrl !== undefined) {
            updateData.image = imageUrl;
        }

        // Remove undefined fields
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(updatedEvent);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully!' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};