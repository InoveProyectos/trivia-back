import nock from "nock";

const entregasTriviaModerated = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/1")
  .reply(200, {
    id: 1,
    name: "PI-06 Unidad",
    description:
      "Trivia multiplechoice, debe seleccionar la respuesta correcta en cada desafio",
    moderated: true,
    end_date: "",
  });

const entregasTriviaNotModerated = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/2")
  .reply(200, {
    id: 2,
    name: "PI-06 Unidad",
    description:
      "Trivia multiplechoice, debe seleccionar la respuesta correcta en cada desafio",
    moderated: false,
    end_date: "2023-02-01",
  });

const entregasChallenges = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/1/challenges")
  .reply(200, {
    challenges: [1, 0],
  });

const entregasUsersStaff = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/0/user/santi")
  .reply(200, {
    username: "santi",
    name: "Santiago Barrios",
    is_staff: true,
    role: "profesor",
    score: 80,
    bonus: 40,
  });

const entregasUsersNotStaff = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/0/user/juli")
  .reply(200, {
    username: "juli",
    name: "Julián Salinas",
    is_staff: false,
    role: "estudiante",
    score: 80,
    bonus: 40,
  });

const entregasGetResults = nock("http://0.0.0.0:8095")
  .get("/api/v1.0/trivia/0/results")
  .reply(200, {
    results: [
      {
        username: "santiago_barrios",
        score: 80,
        bonus: 40,
      },
      {
        username: "julian_salinas",
        score: 60,
        bonus: 30,
      },
    ],
  });

const entregasPostResults = nock("http://0.0.0.0:8095")
  .post("/api/v1.0/trivia/0/results")
  .reply(200, {
    results: [
      {
        username: "santiago_barrios",
        score: 80,
        bonus: 40,
      },
      {
        username: "julian_salinas",
        score: 60,
        bonus: 30,
      },
    ],
  });

export default {
  entregasTriviaModerated,
  entregasTriviaNotModerated,
  entregasChallenges,
  entregasUsersStaff,
  entregasUsersNotStaff,
  entregasGetResults,
  entregasPostResults,
};
