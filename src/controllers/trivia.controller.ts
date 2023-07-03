import axios from "axios";
import { triviaResponse } from "../interface";

export async function getTriviaById(id: string) {
  try {
    const res: triviaResponse = await axios.get(
      `http://0.0.0.0:8095/api/v1.0/trivia/${id}`
      // `${process.env.BACKEND_URL}/trivia/${id}`
    );
    console.log(id);
    console.log(res);
    return res;
  } catch (err) {
    console.error({ err });
    return err;
  }
}

export async function getChallengesIds(id: string) {
  try {
    const res = await axios.get(
      `http://0.0.0.0:8095/api/v1.0/trivia/${id}/challenges`
    );
    console.log(res);
    return res;
  } catch (err) {
    console.error({ err });
    return err;
  }
}

async function getChallengesById(id: any) {
  try {
    const respuesta = await axios.get(
      `http://0.0.0.0:8096/api/v1.0/trivias?id=${id}`
    );
    return respuesta.data.challenge;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getChallengesByIds(ids: any) {
  try {
    console.log(ids);
    const promesas = ids.map((id: any) => getChallengesById(id));
    const preguntas = await Promise.all(promesas);
    console.log(preguntas);
    return preguntas;
  } catch (err) {
    console.log(err);
    return err;
  }
}

export async function ValidarPreguntas(playersArray: any) {
  try {
    let res = [
      {
        id: "juli",
        score: 0,
        correctAnswer: 2,
      },
    ];
    console.log(playersArray);
    // const response = await axios.post(
    //   `http://0.0.0.0:8096/api/trivia/session/3172`,
    //   {
    //     playersArray,
    //   }
    // );
    // console.log(response.data);
    // return response.data;
    return res;
  } catch (err) {
    console.log(err);
    return err;
  }
}
