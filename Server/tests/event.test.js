
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const User = require("../models/User");
const Event = require("../models/Event");

let mongoServer;
let adminToken;
let userToken;
let adminUser;
let normalUser;

const eventData = {
    title: "Tech Fest",
    description: "Annual college technology festival",
    date: "2027-02-15",
    location: "Ghaziabad",
    category: "Technology",
    totalSeats: 100,
    ticketPrice: 200,
    imageUrl: "https://example.com/event.jpg"
};

const createToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET
    );
};

beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    adminUser = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin",
        isVerified: true
    });

    normalUser = await User.create({
        name: "Student",
        email: "student@test.com",
        password: "password123",
        role: "user",
        isVerified: true
    });

    adminToken = createToken(adminUser);
    userToken = createToken(normalUser);
});

afterEach(async () => {
    await Event.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Gatherr Event API", () => {

    // GET ALL EVENTS

    test("GET /api/events should return all events", async () => {
        await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .get("/api/events");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe("Tech Fest");
    });

    test("GET /api/events should filter events by category", async () => {
        await Event.create([
            {
                ...eventData,
                image: eventData.imageUrl,
                createdBy: adminUser._id,
                availableSeats: 100
            },
            {
                ...eventData,
                title: "Music Night",
                category: "Music",
                image: eventData.imageUrl,
                createdBy: adminUser._id,
                availableSeats: 100
            }
        ]);

        const response = await request(app)
            .get("/api/events?category=Technology");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].category).toBe("Technology");
    });

    test("GET /api/events should filter events by location", async () => {
        await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .get("/api/events?location=Ghaziabad");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].location).toBe("Ghaziabad");
    });

    // GET EVENT BY ID

    test("GET /api/events/:id should return an event", async () => {
        const event = await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .get(`/api/events/${event._id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe("Tech Fest");
    });

    test("GET /api/events/:id should return 404 for missing event", async () => {
        const id = new mongoose.Types.ObjectId();

        const response = await request(app)
            .get(`/api/events/${id}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Event not found");
    });

    // CREATE EVENT

    test("POST /api/events should create an event as admin", async () => {
        const response = await request(app)
            .post("/api/events")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(eventData);

        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe("Tech Fest");
        expect(response.body.totalSeats).toBe(100);
        expect(response.body.availableSeats).toBe(100);
        expect(response.body.createdBy).toBe(adminUser._id.toString());
    });

    test("POST /api/events should reject unauthenticated users", async () => {
        const response = await request(app)
            .post("/api/events")
            .send(eventData);

        expect(response.statusCode).toBe(401);
    });

    test("POST /api/events should reject normal users", async () => {
        const response = await request(app)
            .post("/api/events")
            .set("Authorization", `Bearer ${userToken}`)
            .send(eventData);

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Admin authorization required");
    });

    // UPDATE EVENT

    test("PUT /api/events/:id should update an event as admin", async () => {
        const event = await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .put(`/api/events/${event._id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ title: "Updated Tech Fest" });

        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe("Updated Tech Fest");
    });

    test("PUT /api/events/:id should return 404 for missing event", async () => {
        const id = new mongoose.Types.ObjectId();

        const response = await request(app)
            .put(`/api/events/${id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ title: "Updated Event" });

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Event not found");
    });

    // DELETE EVENT

    test("DELETE /api/events/:id should delete an event as admin", async () => {
        const event = await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .delete(`/api/events/${event._id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Event deleted successfully");

        const deletedEvent = await Event.findById(event._id);
        expect(deletedEvent).toBeNull();
    });

    test("DELETE /api/events/:id should reject normal users", async () => {
        const event = await Event.create({
            ...eventData,
            image: eventData.imageUrl,
            createdBy: adminUser._id,
            availableSeats: 100
        });

        const response = await request(app)
            .delete(`/api/events/${event._id}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Admin authorization required");
    });
});
