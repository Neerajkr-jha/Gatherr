const request = require("supertest");
const app = require("../app");

describe("Gatherr API", () => {
  test("GET / should return welcome message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Welcome to Gatherr API");
  });
});