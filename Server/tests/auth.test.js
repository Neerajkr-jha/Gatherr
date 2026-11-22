
process.env.JWT_SECRET = "test_secret_key";

jest.mock("../utils/email.js", () => ({
    sendOtpEmail: jest.fn().mockResolvedValue(true),
    sendBookingEmail: jest.fn().mockResolvedValue(true)
}));

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");

const User = require("../models/User");
const OTP = require("../models/OTP");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await OTP.deleteMany({});
});

describe("Authentication API Tests", () => {

    // Test 1: Register a new user
    test("Should register a new user successfully", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.email).toBe("test@example.com");

        const user = await User.findOne({
            email: "test@example.com"
        });

        expect(user).not.toBeNull();
        expect(user.isVerified).toBe(false);
        expect(user.password).not.toBe("password123");

        expect(await bcrypt.compare("password123", user.password)).toBe(true);

        const otp = await OTP.findOne({
            email: "test@example.com",
            action: "account_verification"
        });

        expect(otp).not.toBeNull();
    });

    // Test 2: Reject duplicate email
    test("Should reject registration with an existing email", async () => {
        await User.create({
            name: "Existing User",
            email: "test@example.com",
            password: "hashedpassword",
            role: "user"
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Another User",
                email: "test@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("User already exists");
    });

    // Test 3: Verify account using valid OTP
    test("Should verify account with valid OTP", async () => {
        const user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            role: "user",
            isVerified: false
        });

        await OTP.create({
            email: user.email,
            otp: "123456",
            action: "account_verification"
        });

        const response = await request(app)
            .post("/api/auth/verify-otp")
            .send({
                email: user.email,
                otp: "123456"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("OTP verified successfully");
        expect(response.body.token).toBeDefined();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.isVerified).toBe(true);

        const remainingOTP = await OTP.findOne({
            email: user.email,
            action: "account_verification"
        });

        expect(remainingOTP).toBeNull();

        const decoded = jwt.verify(
            response.body.token,
            process.env.JWT_SECRET
        );

        expect(decoded.id).toBe(user._id.toString());
    });

    // Test 4: Reject invalid OTP
    test("Should reject invalid OTP", async () => {
        const response = await request(app)
            .post("/api/auth/verify-otp")
            .send({
                email: "test@example.com",
                otp: "999999"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Invalid OTP");
    });

    // Test 5: Login with correct credentials
    test("Should login a verified user successfully", async () => {
        await User.create({
            name: "Test User",
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            role: "user",
            isVerified: true
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.email).toBe("test@example.com");

        const decoded = jwt.verify(
            response.body.token,
            process.env.JWT_SECRET
        );

        expect(decoded.role).toBe("user");
    });

    // Test 6: Reject incorrect password
    test("Should reject login with incorrect password", async () => {
        await User.create({
            name: "Test User",
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            role: "user",
            isVerified: true
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "wrongpassword"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("Invalid credentials");
    });

    // Test 7: Reject login for an unregistered user
    test("Should reject login for an unknown email", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "unknown@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("sign up first");
    });

    // Test 8: Reject login before account verification
    test("Should reject login if account is not verified", async () => {
        await User.create({
            name: "Test User",
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            role: "user",
            isVerified: false
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("not verified");

        const otp = await OTP.findOne({
            email: "test@example.com",
            action: "account_verification"
        });

        expect(otp).not.toBeNull();
    });
});
