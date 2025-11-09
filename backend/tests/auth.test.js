const request = require("supertest");
const app = require("../index");
const { User, disconnectMongo } = require("../mongo");

describe("Auth endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await disconnectMongo();
  });

  test("register -> login flow", async () => {
    const email = `test${Date.now()}@example.com`;
    const password = "pass123";

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Tester", email, password });
    expect(reg.statusCode).toBe(200);
    expect(reg.body.user.email).toBe(email);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeTruthy();
  });
});
