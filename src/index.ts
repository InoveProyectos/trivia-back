import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import {
  getChallengesByIds,
  getChallengesIds,
  ValidarPreguntas,
  getTriviaById
} from "./controllers/trivia.controller";
import { getUserByusername } from "./controllers/user.controller";
import { ResCallbackGetTriviaById, RoomState } from "./interface";
import { createNewRoom, getUserRole } from "./utils";

require("dotenv").config();

// interface RoomState {
//   estadoTrivia: number | null; // 0 = esperando jugadores, 1 = iniciada, 2 = finalizada
//   estadoPregunta?: number | null; // 0 = esperando res, 1 = respuesta elegida, 2 = validando respuesta
//   idChallengeActual: number;
//   challenges?: any;
//   trivia: any;
//   nameRoom: string;
//   players: Record<string, { res: number[]; cantCorrectAnswer?: number }>;
//   moderators: string[];
//   resPlayers: string[];
//   usersInRoom: any;
//   arrlastResponses: any[];
//   arrlastResCorrectas: any[],
//   lastcantRespuestas: Record<number, number>
// }


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

  socket.join("lobby");

  socket.on("getUserByUsername", async (data, callback) => {
    try {
      const res: any = await getUserByusername(data);
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
    let nameRoom = "";
    let userRoom = data.id + "-" + data.user.username;
    let resCallback: ResCallbackGetTriviaById = {
      trivia: null,
      triviaFinalizada: null,
      triviaIniciada: null,
      nameRoom: ""
    };
    try {
      const resGetTriviaById: any = await getTriviaById(data.id);
      if(resGetTriviaById.data.moderated){
        if (!roomState[data.id] ){
          //llamar a la funcion getnewRoom o algo asi
          createNewRoom(nameRoom, data, socket, roomState, usersInRoom, io, resGetTriviaById)
        } else {
          socket.join(roomState[data.id].nameRoom);
          //llamar a la que le da el rol
          getUserRole(data, roomState, nameRoom)
          if(roomState[data.id].estadoTrivia == 1){
            resCallback = {
              trivia: roomState[data.id].trivia,
              triviaIniciada: true,
              triviaFinalizada: false,
              nameRoom: roomState[data.id].nameRoom
            }
          }
          if(roomState[data.id].estadoTrivia == 2){
            resCallback = {
              trivia: roomState[data.id].trivia,
              triviaIniciada: false,
              triviaFinalizada: true,
              nameRoom: roomState[data.id].nameRoom
            }
          }
          if(roomState[data.id].estadoTrivia == 0){
            resCallback = {
              trivia: roomState[data.id].trivia,
              triviaIniciada: false,
              triviaFinalizada: false,
              nameRoom: roomState[data.id].nameRoom
            }
          }
        }
      }
      if (!roomState[userRoom]){
        //llamar a la funcion getnewRoom o algo asi
        createNewRoom(nameRoom, data, socket, roomState, usersInRoom, io, resGetTriviaById)
      }else{
        // armar un rechazo y que no se pueda unir
        if(roomState[userRoom] && roomState[userRoom].players[data.user.username]){
          socket.join(roomState[userRoom].nameRoom);
          getUserRole(data, roomState, userRoom)
          if(roomState[userRoom].estadoTrivia == 1){
            resCallback = {
              trivia: roomState[userRoom].trivia,
              triviaIniciada: true,
              triviaFinalizada: false,
              nameRoom: userRoom
            }
          }
          if(roomState[userRoom].estadoTrivia == 2){
            resCallback = {
              trivia: roomState[userRoom].trivia,
              triviaIniciada: false,
              triviaFinalizada: true,
              nameRoom: userRoom
            }
          }
          if(roomState[userRoom].estadoTrivia == 0){
            resCallback = {
              trivia: roomState[userRoom].trivia,
              triviaIniciada: false,
              triviaFinalizada: false,
              nameRoom: userRoom
            }
          }
        }else{
          throw new Error("No es posible unirse a la trivia.")
        }
      }
      roomState[userRoom].usersInRoom = io.sockets.adapter.rooms.get(
        roomState[userRoom].nameRoom
      )?.size;
      io.to(userRoom).emit(
        "listenCountUsersConected",
        roomState[userRoom].usersInRoom
      );
      callback(resCallback);
    } catch (err) {
      // console.log(err);
      callback({ err: err });
      return;
    }
  });

  socket.on("startTrivia", async (params, callback) => {
    var {id, nameRoom} = params;
    try {
      io.to(nameRoom).emit("showLoaderRes", true);
      const res: any = await getChallengesIds(id);
      if (res.status == 200) {
        if (res.data.challenges.length > 0) {
          const resChallenges: any = await getChallengesByIds(
            res.data.challenges
          );
          if (!roomState[nameRoom].challenges) {
            roomState[nameRoom].challenges = resChallenges;
          }
          let params = {
            challenges: resChallenges[roomState[nameRoom].idChallengeActual],
            id: id,
            moreQuestions: resChallenges[
              roomState[nameRoom].idChallengeActual + 1
            ]
              ? true
              : false,
          };
          roomState[nameRoom].estadoTrivia = 1; //Iniciada
          roomState[nameRoom].estadoPregunta = 0; //Esperando
          io.to(roomState[nameRoom].nameRoom).emit(
            "estadoTrivia",
            roomState[nameRoom].estadoTrivia
          );
          io.to(roomState[nameRoom].nameRoom).emit(
            "estadoPregunta",
            roomState[nameRoom].estadoPregunta
          );
          io.to(roomState[nameRoom].nameRoom).emit("startTriviaRes", params); // envio a todos que arranquen la trivia
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
      //TODO normalizar los mensajes de error
      callback({
        status: 500,
        messaje: err,
      });
      return;
    }
  });

  socket.on("ReloadTrivia", async (params, callback) => {
    console.log(params, callback)
    var {username, nameRoom} = params;
    try {
      //lo vuelvo a meter en la sala que pertenece
      socket.join(nameRoom);
      socket.emit("showLoaderRes", true);
      // const res: any = await getChallengesIds(data.id);
      // console.log({ res });

      //si la trivia no arranco
      if(Object.keys(roomState).length == 0 || !roomState[nameRoom].estadoTrivia || roomState[nameRoom].estadoTrivia == 0){
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
      if(!roomState[nameRoom].moderators.includes(username)){
        ultimoElemento = roomState[nameRoom].players[username].res[roomState[nameRoom].players[username].res.length - 1];
      }else{
        ultimoElemento = null
      }

      let params = {
        challenge: roomState[nameRoom].challenges[roomState[nameRoom].idChallengeActual],
        estadoPregunta: roomState[nameRoom].estadoPregunta,
        estadoTrivia: roomState[nameRoom].estadoTrivia,
        cantResUsers: roomState[nameRoom].resPlayers.length,
        moreQuestions: roomState[nameRoom].challenges[
          roomState[nameRoom].idChallengeActual + 1
        ]
          ? true
          : false,
        ansSelected: ultimoElemento,
        resRespuestas: roomState[nameRoom].arrlastResponses,
        cantResCorrectas: roomState[nameRoom].arrlastResCorrectas,
        cantRespuestas: roomState[nameRoom].lastcantRespuestas,
        blockAnswers: roomState[nameRoom].estadoPregunta == 2 ? true : false
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

  socket.on("ansSelected", (params, callback) => {
    var {userName, nameRoom, res} = params
    try{
      roomState[nameRoom].players[userName].cantCorrectAnswer = roomState[nameRoom].players[userName].cantCorrectAnswer || 0;
      roomState[nameRoom].players[userName].res?.push(res)
      roomState[nameRoom].estadoPregunta = 1;
      if (!roomState[nameRoom].resPlayers.includes(userName)) {
        roomState[nameRoom].resPlayers.push(userName);
      }
      io.to(nameRoom).emit(
        "estadoPregunta",
        roomState[nameRoom].estadoPregunta
      );
      io.to(nameRoom).emit(
        "resPlayers",
        roomState[nameRoom].resPlayers.length
      );
      return;
    }catch(err){
      callback(err)
      //TODO Manejar correctamente este error
      return
    }
  });

  socket.on("validarPreguntas", async (params, callback) => {
    var {nameRoom} = params;
    try {
      io.to(nameRoom).emit("showLoaderRes", true);
      const playersArray = Object.entries(roomState[nameRoom].players).map(
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

      roomState[nameRoom].lastcantRespuestas = cantidadRespuestas

      const res: any = await ValidarPreguntas(playersArray);
      //TODO IMPORTANTE manejar este error si es que falla

      roomState[nameRoom].arrlastResponses = res
      const arrResCorrectas: any = res.map((player: any) => {
        if (player.score !== 0) {
          roomState[nameRoom].players[player.id].cantCorrectAnswer = +1;
          return player;
        }
      });
      roomState[nameRoom].arrlastResCorrectas = arrResCorrectas
      roomState[nameRoom].estadoPregunta = 2; //validando respuesta
      io.to(nameRoom).emit(
        "estadoPregunta",
        roomState[nameRoom].estadoPregunta
      );

      const params = {
        resRespuestas: res,
        cantResCorrectas: arrResCorrectas.length,
        cantRespuestas: cantidadRespuestas,
      };
      io.to(nameRoom).emit("validarPreguntasRes", params);
      return;
    } catch (err) {
      console.log(err);
      callback(err)
      return;
    }
  });

  // socket.on("showLoader", (data: any) => {
  //   io.to(roomState[data.id].nameRoom).emit("showLoaderRes", data.show);
  // });

  socket.on("nextChallenge", async (params, callback) => {
    var {nameRoom} = params;
    try {
      io.to(nameRoom).emit("showLoaderRes", true);
      roomState[nameRoom].idChallengeActual =
      roomState[nameRoom].idChallengeActual + 1;
      roomState[nameRoom].estadoPregunta = 0; //Seteo estado pregunta
      const playersAux = roomState[nameRoom].players;
      for (const playerId in playersAux) {
        if (Object.prototype.hasOwnProperty.call(playersAux, playerId)) {
          playersAux[playerId].res = [];
        }
      }
      roomState[nameRoom].players = playersAux;
      // roomState[triviaId].players.map((player)=>{

      // })
      roomState[nameRoom].resPlayers = [];
      roomState[nameRoom].arrlastResponses = []
      roomState[nameRoom].arrlastResCorrectas = []
      roomState[nameRoom].lastcantRespuestas = {}
      io.to(nameRoom).emit("nextChallengeRes", {
        challenge:
          roomState[nameRoom].challenges[roomState[nameRoom].idChallengeActual],
        estadoPregunta: roomState[nameRoom].estadoPregunta,
        cantResUsers: roomState[nameRoom].resPlayers.length,
        moreQuestions: roomState[nameRoom].challenges[
          roomState[nameRoom].idChallengeActual + 1
        ]
          ? true
          : false,
      });
      return;
    } catch (err) {
      //TODO Manejar correctamente este error
      callback(err)
      return;
    }
  });

  socket.on("endTrivia", (params, callback) => {
    var {nameRoom} = params;
    try {
      io.to(nameRoom).emit("showLoaderRes", true);
      roomState[nameRoom].estadoPregunta = 2;
      roomState[nameRoom].estadoTrivia = 2; //finalizando trivia
      io.to(nameRoom).emit(
        "estadoTrivia",
        roomState[nameRoom].estadoTrivia
      );
      io.to(nameRoom).emit(
        "estadoPregunta",
        roomState[nameRoom].estadoPregunta
      );
      io.to(nameRoom).emit("resEndTrivia", {
        players: roomState[nameRoom].players,
        cantQuestions: roomState[nameRoom].challenges.length,
      });
      return;
    } catch (err) {
      console.log(err);
      //TODO Manejar correctamente este error
      callback(err)
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
    entregasChallengesNotModerated,
    entregasUsersStaff,
    entregasUsersNotStaff,
    entregasGetResults,
    entregasPostResults,
  } = require("./mocks/entregas.mock").default;

  entregasTriviaModerated.persist();
  entregasTriviaNotModerated.persist();
  entregasChallenges.persist();
  entregasChallengesNotModerated.persist();
  entregasUsersStaff.persist();
  entregasUsersNotStaff.persist();
  entregasGetResults.persist();
  entregasPostResults.persist();
}

// console.log(process.env.PORT);

server.listen(process.env.PORT, () => {
  // console.log("listening on " + process.env.PORT);
});
