import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import {
  getChallengesByIds,
  getChallengesIds,
  getTriviaById,
  ValidarPreguntas,
} from "./controllers/trivia.controller";
import { getUserByusername } from "./controllers/user.controller";

require("dotenv").config();

interface RoomState {
  estadoTrivia: number | null; // 0 = esperando jugadores, 1 = iniciada, 2 = finalizada
  estadoPregunta?: number | null; // 0 = esperando res, 1 = respuesta elegida, 2 = validando respuesta
  idChallengeActual: number;
  challenges?: any;
  trivia: any;
  nameRoom: string;
  players: Record<string, { res: number[]; cantCorrectAnswer?: number }>;
  moderators: string[];
  resPlayers: string[];
  usersInRoom: any;
  arrlastResponses: any[];
  arrlastResCorrectas: any[],
  lastcantRespuestas: Record<number, number>
}


/*\
type Player{
  id:uuid
  name:string
  responses:[idRespuesta]
  rol:
  isModerator:

}

type Challenge{
  time:number,
  name:string
  description:string
  title:string
  options:[Option]
}
estadoTrivia = {
  lobby: bool
  started: bool
  ended: bool
}
estadoPregunta={
  awaitingResponses:
  finalizaded:
}

challenges:[Challenge]\
trivia:Trivia
nameRoom:string
players:[Player]
usersInRoom ? <- opcional para mi ya esta en lenght de players



*/

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
  },
});
let usersInRoom: any;
// const trivias: any = {};
const usersConected: any = {};
const roomState: Record<string, RoomState> = {};

app.use(express.json());
app.use(cors());

app.use(morgan("dev"));

// console.log(state.idChallengeActual);

io.on("connection", (socket) => {
  // const rooms = io.sockets.adapter.rooms;
  const userId = socket.id;
  usersConected[userId] = socket;
  console.log("user connected");
  // console.log("rooms", rooms);

  socket.join("lobby");

  socket.on("getUserByUsername", async (data, callback) => {
    // console.log({ data });
    try {
      const res: any = await getUserByusername(data);
      // console.log(res);
      if (usersConected[res.data.username]) {
        usersConected[res.data.username] = socket;
      }
      if (res.status == 200) {
        callback({ res: res.data });
      } else {
        throw new Error("Error");
      }
    } catch (err) {
      // console.log(err);
      callback({ err: err });
      return;
    }
  });

  socket.on("get-triviaById", async (data, callback) => {
    // console.log({ data });
    let nameRoom = "";
    let resCallback: any = {};
    try {
      if (!roomState[data.id]) {
        const resServ: any = await getTriviaById(data.id);
        resCallback = resServ.data;
        if (resServ.status == 200) {
          if (resCallback.moderated) {
            nameRoom = data.id + "-MD";
            socket.join(nameRoom);
          } else {
            nameRoom = data.id + data.user.username;
            socket.join(nameRoom);
          }
          roomState[data.id] = {
            estadoTrivia: 0,
            idChallengeActual: 0,
            trivia: resCallback,
            nameRoom: nameRoom,
            players: {},
            moderators: [],
            resPlayers: [],
            usersInRoom,
            arrlastResponses: [],
            arrlastResCorrectas: [],
            lastcantRespuestas: {}
          };
          io.to(roomState[data.id].nameRoom).emit(
            "estadoTrivia",
            roomState[data.id].estadoTrivia
          );
          if (data.user.role == "profesor") {
            if (!roomState[data.id].moderators.includes(data.user.username)) {
              roomState[data.id].moderators.push(data.user.username);
            }
          } else {
            roomState[data.id].players[data.user.username] = {
              res: [],
              cantCorrectAnswer: 0,
            };
          }
        } else {
          throw new Error("El servicio no responde");
        }
      } else {
        if (data.user.role == "profesor") {
          if (!roomState[data.id].moderators.includes(data.user.username)) {
            roomState[data.id].moderators.push(data.user.username);
          }
        } else {
          if (!roomState[data.id].players[data.user.username]) {
            roomState[data.id].players[data.user.username] = {
              res: [],
              cantCorrectAnswer: 0,
            };
          }
        }
        socket.join(roomState[data.id].nameRoom);
        resCallback = roomState[data.id].trivia;
      }
      roomState[data.id].usersInRoom = io.sockets.adapter.rooms.get(
        roomState[data.id].nameRoom
      )?.size;
      io.to(roomState[data.id].nameRoom).emit(
        "listenCountUsersConected",
        roomState[data.id].usersInRoom
      );
      callback({ res: resCallback });
    } catch (err) {
      // console.log(err);
      callback({ err: err });
      return;
    }
  });

  socket.on("startTrivia", async (data, callback) => {
    try {
      io.to(roomState[data.id].nameRoom).emit("showLoaderRes", true);
      const res: any = await getChallengesIds(data.id);
      // console.log({ res });
      if (res.status == 200) {
        if (res.data.challenges.length > 0) {
          const resChallenges: any = await getChallengesByIds(
            res.data.challenges
          );
          if (!roomState[data.id].challenges) {
            roomState[data.id].challenges = resChallenges;
          }
          let params = {
            challenges: resChallenges[roomState[data.id].idChallengeActual],
            id: data.id,
            moreQuestions: resChallenges[
              roomState[data.id].idChallengeActual + 1
            ]
              ? true
              : false,
          };
          // console.log(resChallenges);
          roomState[data.id].estadoTrivia = 1; //Iniciada
          roomState[data.id].estadoPregunta = 0; //Esperando
          io.to(roomState[data.id].nameRoom).emit(
            "estadoTrivia",
            roomState[data.id].estadoTrivia
          );
          io.to(roomState[data.id].nameRoom).emit(
            "estadoPregunta",
            roomState[data.id].estadoPregunta
          );
          io.to(roomState[data.id].nameRoom).emit("startTriviaRes", params); // envio a todos que arranquen la trivia
          callback({
            status: 200,
            messaje: "Inicio de trivia exitoso",
          });
        } else {
          throw new Error("No se pudo iniciar la trivia");
        }
      } else {
        throw new Error("No se pudo iniciar la trivia");
      }
      return;
    } catch (err) {
      // console.log(err);
      callback({
        status: 500,
        messaje: err,
      });
      return;
    }
  });

  socket.on("ReloadTrivia", async (data, callback) => {
    console.log(data, callback)
    var {triviaInfo, username} = data;
    let nameRoom = ""
    try {
      //lo vuelvo a meter en la sala que pertenece
      if (triviaInfo.moderated) {
        nameRoom = triviaInfo.id + "-MD";
        socket.join(nameRoom);
      } else {
        nameRoom = triviaInfo.id + username;
        socket.join(nameRoom);
      }
      // io.to(roomState[data.id].nameRoom).emit("showLoaderRes", true);
      socket.emit("showLoaderRes", true);
      // const res: any = await getChallengesIds(data.id);
      // console.log({ res });
      if(Object.keys(roomState).length == 0 || !roomState[triviaInfo.id].estadoTrivia || roomState[triviaInfo.id].estadoTrivia == 0){
        callback({
          status: 200,
          messaje: "Inicio de trivia exitoso",
          data: {}
        });  
        return
      }

      /* 
      const params = {
        resRespuestas: res,
        cantResCorrectas: cantResCorrectas.length,
        cantRespuestas: cantidadRespuestas,
      };
      */
     var ultimoElemento
      if(!roomState[triviaInfo.id].moderators.includes(username)){
        ultimoElemento = roomState[triviaInfo.id].players[username].res[roomState[triviaInfo.id].players[username].res.length - 1];
      }else{
        ultimoElemento = null
      }

      let params = {
        challenge: roomState[triviaInfo.id].challenges[roomState[triviaInfo.id].idChallengeActual],
        estadoPregunta: roomState[triviaInfo.id].estadoPregunta,
        estadoTrivia: roomState[triviaInfo.id].estadoTrivia,
        cantResUsers: roomState[triviaInfo.id].resPlayers.length,
        moreQuestions: roomState[triviaInfo.id].challenges[
          roomState[triviaInfo.id].idChallengeActual + 1
        ]
          ? true
          : false,
        ansSelected: ultimoElemento,
        resRespuestas: roomState[triviaInfo.id].arrlastResponses,
        cantResCorrectas: roomState[triviaInfo.id].arrlastResCorrectas,
        cantRespuestas: roomState[triviaInfo.id].lastcantRespuestas,
        blockAnswers: roomState[triviaInfo.id].estadoPregunta == 2 ? true : false
      };
      callback({
        status: 200,
        messaje: "Inicio de trivia exitoso",
        data: params
      });
      return;
    } catch (err) {
      console.log(err);
      callback({
        status: 500,
        messaje: err,
      });
      return;
    }
  });

  socket.on("ansSelected", (data: any) => {
    try{
      roomState[data.id].players[data.userName].cantCorrectAnswer = roomState[data.id].players[data.userName].cantCorrectAnswer || 0;
      roomState[data.id].players[data.userName].res?.push(data.res)
      roomState[data.id].estadoPregunta = 1;
      if (!roomState[data.id].resPlayers.includes(data.userName)) {
        roomState[data.id].resPlayers.push(data.userName);
      }
      io.to(roomState[data.id].nameRoom).emit(
        "estadoPregunta",
        roomState[data.id].estadoPregunta
      );
      io.to(roomState[data.id].nameRoom).emit(
        "resPlayers",
        roomState[data.id].resPlayers.length
      );
      return;
    }catch(err){
      return err
    }
  });

  socket.on("validarPreguntas", async (data: any) => {
    try {
      io.to(roomState[data.id].nameRoom).emit("showLoaderRes", true);
      const playersArray = Object.entries(roomState[data.id].players).map(
        ([username, user]) => ({
          id: username,
          selected: [user.res && user.res[user.res.length - 1]],
        })
      );

      const cantidadRespuestas: Record<number, number> = {};

      playersArray.forEach((res: any) => {
        if (!cantidadRespuestas[res.selected[0]]) {
          cantidadRespuestas[res.selected[0]] = 1;
        } else {
          cantidadRespuestas[res.selected[0]] += 1;
        }
      });

      roomState[data.id].lastcantRespuestas = cantidadRespuestas

      const res: any = await ValidarPreguntas(playersArray);
      roomState[data.id].arrlastResponses = res
      const arrResCorrectas: any = res.map((player: any) => {
        if (player.score !== 0) {
          roomState[data.id].players[player.id].cantCorrectAnswer = +1;
          return player;
        }
      });
      roomState[data.id].arrlastResCorrectas = arrResCorrectas
      roomState[data.id].estadoPregunta = 2; //validando respuesta
      io.to(roomState[data.id].nameRoom).emit(
        "estadoPregunta",
        roomState[data.id].estadoPregunta
      );

      const params = {
        resRespuestas: res,
        cantResCorrectas: arrResCorrectas.length,
        cantRespuestas: cantidadRespuestas,
      };
      io.to(roomState[data.id].nameRoom).emit("validarPreguntasRes", params);
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });

  // socket.on("showLoader", (data: any) => {
  //   io.to(roomState[data.id].nameRoom).emit("showLoaderRes", data.show);
  // });

  socket.on("nextChallenge", async (triviaId: any) => {
    try {
      io.to(roomState[triviaId].nameRoom).emit("showLoaderRes", true);
      roomState[triviaId].idChallengeActual =
        roomState[triviaId].idChallengeActual + 1;
      roomState[triviaId].estadoPregunta = 0; //Seteo estado pregunta
      const playersAux = roomState[triviaId].players;
      for (const playerId in playersAux) {
        if (Object.prototype.hasOwnProperty.call(playersAux, playerId)) {
          playersAux[playerId].res = [];
        }
      }
      roomState[triviaId].players = playersAux;
      // roomState[triviaId].players.map((player)=>{

      // })
      roomState[triviaId].resPlayers = [];
      roomState[triviaId].arrlastResponses = []
      roomState[triviaId].arrlastResCorrectas = []
      roomState[triviaId].lastcantRespuestas = {}
      io.to(roomState[triviaId].nameRoom).emit("nextChallengeRes", {
        challenge:
          roomState[triviaId].challenges[roomState[triviaId].idChallengeActual],
        estadoPregunta: roomState[triviaId].estadoPregunta,
        cantResUsers: roomState[triviaId].resPlayers.length,
        moreQuestions: roomState[triviaId].challenges[
          roomState[triviaId].idChallengeActual + 1
        ]
          ? true
          : false,
      });
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });

  socket.on("endTrivia", (triviaId: any) => {
    try {
      io.to(roomState[triviaId].nameRoom).emit("showLoaderRes", true);
      roomState[triviaId].estadoPregunta = 2;
      roomState[triviaId].estadoTrivia = 2; //finalizando trivia
      io.to(roomState[triviaId].nameRoom).emit(
        "estadoTrivia",
        roomState[triviaId].estadoTrivia
      );
      io.to(roomState[triviaId].nameRoom).emit(
        "estadoPregunta",
        roomState[triviaId].estadoPregunta
      );
      io.to(roomState[triviaId].nameRoom).emit("resEndTrivia", {
        players: roomState[triviaId].players,
        cantQuestions: roomState[triviaId].challenges.length,
      });
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    // io.to(nameRoom).emit("listenCountUsersConected", usersInRoom);
  });
});

if (process.env.TS_NODE_DEV) {
  // console.log("Enabling mocks");

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

// console.log(process.env.PORT);

server.listen(process.env.PORT, () => {
  // console.log("listening on " + process.env.PORT);
});
