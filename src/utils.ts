import { Server, Socket } from "socket.io";
// import { getTriviaById } from "./controllers/trivia.controller";
import { ResCallbackGetTriviaById, RoomState } from "./interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

let resCallback: ResCallbackGetTriviaById = {
  trivia: null,
  triviaFinalizada: null,
  triviaIniciada: null,
  nameRoom: ""
};

export const createNewRoom = async (
  nameRoom: string,
  data: any,
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  roomState: Record<string, RoomState>,
  usersInRoom: any,
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  resGetTriviaById: any
  ) => {
  // const resServ: any = await getTriviaById(data.id);
  resCallback = {
    trivia: resGetTriviaById.data,
    triviaIniciada: false,
    triviaFinalizada: false,
    nameRoom: nameRoom
  };
  if (resGetTriviaById.status == 200) {
    if (resCallback.trivia.moderated) {
      nameRoom = data.id;
      socket.join(nameRoom);
    } else {
      nameRoom = data.id + "-" + data.user.username;
      socket.join(nameRoom);
    }
    roomState[nameRoom] = {
      estadoTrivia: 0,
      idChallengeActual: 0,
      trivia: resCallback.trivia,
      nameRoom: nameRoom,
      players: {},
      moderators: [],
      resPlayers: [],
      usersInRoom,
      arrlastResponses: [],
      arrlastResCorrectas: [],
      lastcantRespuestas: {},
    };
    io.to(roomState[nameRoom].nameRoom).emit(
      "estadoTrivia",
      roomState[nameRoom].estadoTrivia
    );
    getUserRole(data, roomState, nameRoom)
    // if (data.user.role == "profesor") {
    //   if (!roomState[nameRoom].moderators.includes(data.user.username)) {
    //     roomState[nameRoom].moderators.push(data.user.username);
    //   }
    // } else {
    //   roomState[nameRoom].players[data.user.username] = {
    //     res: [],
    //     cantCorrectAnswer: 0,
    //   };
    // }
  } else {
    throw new Error("El servicio no responde");
  }
};


export const getUserRole = (data: any, roomState: Record<string, RoomState>,userRoom: string) => {
  if (data.user.role == "profesor") {
    if (!roomState[userRoom].moderators.includes(data.user.username)) {
      roomState[userRoom].moderators.push(data.user.username);
    }
  } else {
    if (!roomState[userRoom].players[data.user.username]) {
      roomState[userRoom].players[data.user.username] = {
        res: [],
        cantCorrectAnswer: 0,
      };
    }
  }
}


// const get