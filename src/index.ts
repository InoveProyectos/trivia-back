import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import { getTriviaById } from "./controllers/trivia.controller";

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
  },
});

app.use(express.json());
app.use(cors());

app.use(morgan("dev"));

io.on("connection", (socket) => {
  console.log("user connected");
  console.log(socket.id);

  socket.on("get-triviaById", async (data) => {
    console.log({ data });
    try {
      const res: any = await getTriviaById(data.id);
      res.status == 200
        ? socket.emit("get-triviaById-res", { res: res.data })
        : socket.emit("get-triviaById-res", { err: "Hubo problemas" });
      return;
    } catch (err) {
      console.log(err);
      socket.emit("get-triviaById-res", { err: err });
      return;
    }
  });
});

if (process.env.TS_NODE_DEV) {
  console.log("Enabling mocks");

  const {
    desafiosMockDeclareVariable,
    desafiosMockVariableType,
    desafiosMockSubmitAnswers,
  } = require("./mocks/desafios.mock").default;

  desafiosMockDeclareVariable.persist();
  desafiosMockVariableType.persist();
  desafiosMockSubmitAnswers.persist();

  const {
    entregasTriviaModerated,
    entregasTriviaNotModerated,
    entregasChallenges,
    entregasUsersStaff,
    entregasUsersNotStaff,
    entregasGetResults,
    entregasPostResults,
  } = require("./mocks/entregas.mock").default;

  entregasTriviaModerated.persist();
  entregasTriviaNotModerated.persist();
  entregasChallenges.persist();
  entregasUsersStaff.persist();
  entregasUsersNotStaff.persist();
  entregasGetResults.persist();
  entregasPostResults.persist();
}

console.log(process.env.PORT);

server.listen(process.env.PORT, () => {
  console.log("listening on " + process.env.PORT);
});
