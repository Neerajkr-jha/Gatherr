# Gatherr – College Event Management System

Gatherr is a full-stack college campus event management platform that brings students, event organizers, and administrators together in one place. It enables students to discover college events, book tickets, and manage their bookings, while administrators can organize events and manage registrations.

## Key Features

- **User Authentication:** Secure registration and login with JWT authentication and email OTP verification.
- **Event Management:** Create, organize, and manage college events.
- **Event Booking:** Students can book tickets through an OTP-based verification process.
- **Booking Management:** View booking history, track booking status, and cancel eligible bookings.
- **Admin Controls:** Manage events, monitor bookings, and confirm pending registrations.
- **Payment Integration:** Razorpay integration for online payment processing.
- **Email Notifications:** Automated emails for OTP verification and booking-related updates.

## Tech Stack

- **Frontend:** React.js, JavaScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Email Service:** Nodemailer
- **Payment Gateway:** Razorpay
- **Testing:** Jest, Supertest, MongoDB Memory Server
- **Tools:** Git, GitHub, Postman

## Backend Testing

Implemented automated API integration tests using Jest and Supertest, with MongoDB Memory Server for isolated database testing.

- Authentication and registration workflows.
- OTP verification and login scenarios.
- Booking creation and validation.
- Seat availability and booking cancellation.
- Authorization and access control.

**Current status:** 15 passing tests across 3 test suites.

## Technical Highlights

- Modular backend architecture using routes, controllers, models, and middleware.
- RESTful API development with Express.js.
- Secure password handling and JWT-based authorization.
- Isolated backend testing with mocked email services.
- Separation of Express application configuration and server startup for easier testing.

## Future Improvements

- Expand automated test coverage for event management.
- Improve booking reliability for concurrent requests.
- Integrate CI/CD for automated testing and deployment.
- Enhance event discovery and filtering.

## Author

**Neeraj Kumar Jha**

[GitHub](https://github.com/Neerajkr-jha)

---

*Gatherr – Bringing college events and communities together.*
