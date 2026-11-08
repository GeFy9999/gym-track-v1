import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { registerUser } from "./helpers.js";

const IMG = "data:image/jpeg;base64,AAAA";

const upload = (token: string, body: object) =>
  request(app)
    .post("/api/progress-photos")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const patch = (token: string, id: string, body: object) =>
  request(app)
    .patch(`/api/progress-photos/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const list = (token: string) =>
  request(app)
    .get("/api/progress-photos")
    .set("Authorization", `Bearer ${token}`);

describe("progress photo notes", () => {
  it("saves a trimmed note on upload and returns it with the date", async () => {
    const { token } = await registerUser();
    const res = await upload(token, { data: IMG, note: "  Fin du bulk  " });
    expect(res.status).toBe(201);
    expect(res.body.note).toBe("Fin du bulk");

    const photos = (await list(token)).body;
    expect(photos[0].note).toBe("Fin du bulk");
    expect(new Date(photos[0].createdAt).getTime()).not.toBeNaN();
  });

  it("edits and clears a note", async () => {
    const { token } = await registerUser();
    const { id } = (await upload(token, { data: IMG })).body;

    const edited = await patch(token, id, { note: "Semaine 4" });
    expect(edited.status).toBe(200);
    expect((await list(token)).body[0].note).toBe("Semaine 4");

    const cleared = await patch(token, id, { note: "   " });
    expect(cleared.status).toBe(200);
    expect((await list(token)).body[0].note).toBeNull();
  });

  it("rejects a note that is too long or not a string", async () => {
    const { token } = await registerUser();
    const { id } = (await upload(token, { data: IMG })).body;

    expect((await patch(token, id, { note: "x".repeat(301) })).status).toBe(400);
    expect((await patch(token, id, { note: { $ne: null } })).status).toBe(400);
    expect((await upload(token, { data: IMG, note: 42 })).status).toBe(400);
  });

  it("can't edit another user's photo", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const { id } = (await upload(owner.token, { data: IMG, note: "Moi" })).body;

    expect((await patch(other.token, id, { note: "Pirate" })).status).toBe(404);
    expect((await list(owner.token)).body[0].note).toBe("Moi");
  });
});
