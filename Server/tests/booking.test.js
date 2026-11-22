process.env.JWT_SECRET = "test_secret_key";

jest.mock("../utils/email.js", () => ({
    sendOtpEmail: jest.fn().mockResolvedValue(true),
    sendBookingEmail: jest.fn().mockResolvedValue(true)
}));

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");

const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Bookings");
const OTP = require("../models/OTP");

let mongoServer;
let user;
let event;
let token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Event.deleteMany({}),
        Booking.deleteMany({}),
        OTP.deleteMany({})
    ]);

    user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "user"
    });

    event = await Event.create({
        title: "Tech Fest",
        description: "College technical event",
        date: new Date("2027-01-15"),
        location: "ABES Engineering College",
        category: "Technology",
        ticketPrice: 500,
        totalSeats: 10,
        availableSeats: 10,
        image: "test-image.jpg",
        createdBy: user._id
    });

    token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET
    );
});

describe("Booking API Tests", () => {

    // Test 1: Send booking OTP
    test("Should send OTP successfully", async () => {
        const response = await request(app)
            .post("/api/bookings/send-otp")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("OTP sent successfully");

        const savedOTP = await OTP.findOne({
            email: user.email,
            action: "event_booking"
        });

        expect(savedOTP).not.toBeNull();
        expect(savedOTP.otp).toMatch(/^\d{6}$/);
    });

    // Test 2: Successful booking
    test("Should create booking with valid OTP", async () => {
        await OTP.create({
            email: user.email,
            otp: "123456",
            action: "event_booking"
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                eventId: event._id.toString(),
                otp: "123456"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("Booking created successfully");

        const booking = await Booking.findOne({
            userId: user._id,
            eventId: event._id
        });

        expect(booking).not.toBeNull();
        expect(booking.status).toBe("pending");
        expect(booking.paymentStatus).toBe("not_paid");
        expect(booking.amount).toBe(500);

        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.availableSeats).toBe(9);

        const remainingOTP = await OTP.findOne({
            email: user.email
        });

        expect(remainingOTP).toBeNull();
    });

    // Test 3: Invalid OTP
    test("Should reject booking with invalid OTP", async () => {
        await OTP.create({
            email: user.email,
            otp: "123456",
            action: "event_booking"
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                eventId: event._id.toString(),
                otp: "999999"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Invalid or expired OTP");

        expect(await Booking.countDocuments()).toBe(0);
    });

    // Test 4: Reject booking when seats are unavailable
    test("Should reject booking when no seats are available", async () => {
        event.availableSeats = 0;
        await event.save();

        await OTP.create({
            email: user.email,
            otp: "123456",
            action: "event_booking"
        });

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                eventId: event._id.toString(),
                otp: "123456"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("No seats available");

        expect(await Booking.countDocuments()).toBe(0);
    });

    // Test 5: Cancel own booking
    test("Should cancel user's own booking and restore seat", async () => {
        const booking = await Booking.create({
            userId: user._id,
            eventId: event._id,
            status: "pending",
            paymentStatus: "not_paid",
            amount: 500
        });

        event.availableSeats = 9;
        await event.save();

        const response = await request(app)
            .delete(`/api/bookings/${booking._id}/cancel`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Booking cancelled successfully");

        const updatedBooking = await Booking.findById(booking._id);
        expect(updatedBooking.status).toBe("cancelled");

        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.availableSeats).toBe(10);
    });

    // Test 6: Reject cancellation by another user
    test("Should not allow another user to cancel the booking", async () => {
        const anotherUser = await User.create({
            name: "Another User",
            email: "another@example.com",
            password: "password123",
            role: "user"
        });

        const anotherToken = jwt.sign(
            { id: anotherUser._id },
            process.env.JWT_SECRET
        );

        const booking = await Booking.create({
            userId: user._id,
            eventId: event._id,
            status: "pending",
            paymentStatus: "not_paid",
            amount: 500
        });

        const response = await request(app)
            .delete(`/api/bookings/${booking._id}/cancel`)
            .set("Authorization", `Bearer ${anotherToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe("Not authorized");
    });
});