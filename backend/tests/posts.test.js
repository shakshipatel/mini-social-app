const request = require("supertest");
const app = require("../index");
const { User, Post, disconnectMongo } = require("../mongo");

describe("Posts endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  afterAll(async () => {
    await disconnectMongo();
  });

  test("create and list posts (auth required)", async () => {
    const email = `poster${Date.now()}@example.com`;
    const password = "postpass";

    // register
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Poster", email, password });
    expect(reg.statusCode).toBe(200);
    const token = reg.body.token;
    expect(token).toBeTruthy();

    // create post
    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Hello", body: "World" });
    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.title).toBe("Hello");

    // list posts
    const list = await request(app).get("/api/posts");
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    const found = list.body.find((p) => p.title === "Hello");
    expect(found).toBeTruthy();
  });
});
