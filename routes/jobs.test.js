"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2AdminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: "0.5",
        companyHandle: "c1",
    };

    test("ok for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                id: expect.any(Number)
            }
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 100000,
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: 1.5,
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c3"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0.3",
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("works: with title filter", async function () {
        const resp = await request(app).get("/jobs?title=j1");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1"
                },
            ],
        });
    });

    test("works: with minSalary filter", async function () {
        const resp = await request(app).get("/jobs?minSalary=200000");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c3"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0.3",
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("works: with equity filter", async function () {
        const resp = await request(app).get("/jobs?hasEquity=true");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c3"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0.3",
                    companyHandle: "c3"
                },
            ],
        });
    });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app).get(`/jobs/${jobs.rows[0].id}`);
        expect(resp.body).toEqual({
            job: {
                id: jobs.rows[0].id,
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for users", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .patch(`/jobs/${jobs.rows[0].id}`)
            .send({
                title: "j1-new"
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: jobs.rows[0].id,
                title: "j1-new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });

    test("unauth for anon", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .patch(`/jobs/${jobs.rows[0].id}`)
            .send({
                title: "j1-new"
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "j1-new"
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .patch(`/jobs/${jobs.rows[0].id}`)
            .send({
                id: 0
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on companyHandle change attempt", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .patch(`/jobs/${jobs.rows[0].id}`)
            .send({
                companyHandle: "c2"
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const jobs = await db.query
            ("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .patch(`/jobs/${jobs.rows[0].id}`)
            .send({
                salary: "not-a-number"
            })
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(400);
    }
    );
});


/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .delete(`/jobs/${jobs.rows[0].id}`)
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.body).toEqual({ deleted: String(jobs.rows[0].id) });
    });

    test("unauth for anon", async function () {
        const jobs = await db.query("SELECT id FROM jobs WHERE title = 'j1'");
        const resp = await request(app)
            .delete(`/jobs/${jobs.rows[0].id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${u2AdminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
