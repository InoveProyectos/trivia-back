export interface triviaResponse {
  id: number;
  name: string;
  description: string;
  moderated: boolean;
  end_date: string;
}
export interface ResCallbackGetTriviaById {
  trivia: any;
  triviaIniciada: boolean | null;
  triviaFinalizada: boolean | null;
  nameRoom: string
}

export interface RoomState {
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

export interface roomState {
  roomState: Record<string, RoomState>
}