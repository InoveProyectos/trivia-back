import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import {
  getChallengesByIds,
  getChallengesIds,
  getTriviaById,
} from "./controllers/trivia.controller";
import { getUserByusername } from "./controllers/user.controller";

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
  },
});
const state = {
  idChallengeActual: 0,
  estadoTrivia: 0, // 0 = ni iniciada, 1 = iniciada, 2 = finalizada
};
let nameRoom = "";
let usersInRoom: any;
const trivias: any = {};
const usersConected: any = {};

app.use(express.json());
app.use(cors());

app.use(morgan("dev"));

console.log(state.idChallengeActual);

io.on("connection", (socket) => {
  const rooms = io.sockets.adapter.rooms;
  const userId = socket.id;
  usersConected[userId] = socket;
  console.log("user connected");
  console.log("rooms", rooms);

  socket.join("lobby");

  socket.on("getUserByUsername", async (data, callback) => {
    console.log({ data });
    try {
      const res: any = await getUserByusername(data.username);
      console.log(res);
      res.status == 200
        ? callback({ res: res.data })
        : callback({ err: "Hubo problemas" });
      return;
    } catch (err) {
      console.log(err);
      callback({ err: err });
      return;
    }
  });

  socket.on("get-triviaById", async (data, callback) => {
    console.log({ data });
    try {
      const res: any = await getTriviaById(data.id);
      if (res.status == 200) {
        trivias[res.data.id] = res.data;
        if (res.data.moderated) {
          nameRoom = data.id + "MD";
          socket.join(nameRoom); //creo la sala
          usersInRoom = io.sockets.adapter.rooms.get(nameRoom)?.size;
          io.to(nameRoom).emit("listenCountUsersConected", usersInRoom);
        } else {
          nameRoom = data.id + data.username;
          socket.join(nameRoom);
          usersInRoom = io.sockets.adapter.rooms.get(nameRoom)?.size;
          io.to(nameRoom).emit("listenCountUsersConected", usersInRoom);
        }
        callback({ res: res.data });
      } else {
        callback({ err: "Hubo problemas" });
      }
      return;
    } catch (err) {
      console.log(err);
      callback({ err: err });
      return;
    }
  });

  socket.on("startTrivia", async (data, callback) => {
    try {
      const res: any = await getChallengesIds(data.id);
      console.log({ res });
      if (res.status == 200) {
        if (res.data.challenges.length > 0) {
          const resChallenges: any = await getChallengesByIds(
            res.data.challenges
          );
          let params = {
            challenges: resChallenges,
            idChallengeActual: state.idChallengeActual,
          };
          console.log(resChallenges);
          let actualRoom =
            data.id + (trivias[data.id].moderated ? "MD" : data.username);
          io.to(actualRoom).emit("startTriviaRes", params); // envio a todos que arranquen la trivia
          callback({
            status: 200,
            messaje: "Inicio de trivia exitoso",
            // res: params, Creoq ue no hace falta retornartlos pro el callback ya que lo va a recibir con el otro evento
          });
        } else {
          callback({
            status: 500,
            messaje: "No se pudo iniciar la trivia",
          });
        }
      } else {
        callback({
          status: 500,
          messaje: "No se pudo iniciar la trivia",
        });
      }
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });

  socket.on("nextChallenge", async () => {
    try {
      console.log(state.idChallengeActual);
      state.idChallengeActual = state.idChallengeActual + 1;
      console.log("Paso al sig challenge ", state.idChallengeActual);
      io.emit("nextChallengeRes", {
        idChallengeActual: state.idChallengeActual,
      });

      // const res: any = await getChallengesIds(data.id);
      // console.log({ res });
      // if (res.status == 200) {
      //   if (res.data.challenges.length > 0) {
      //     const resChallenges: any = await getChallengesByIds(
      //       res.data.challenges
      //     );
      //     console.log(resChallenges);
      //     socket.emit("startTriviaRes", { res: resChallenges });
      //     return;
      //   } else {
      //     socket.emit("startTriviaRes", { err: "Hubo problemas" });
      //     return;
      //   }
      // } else {
      //   socket.emit("startTriviaRes", { err: "Hubo problemas" });
      // }
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    io.to(nameRoom).emit("listenCountUsersConected", usersInRoom);
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
