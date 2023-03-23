import axios from "axios";
import { triviaResponse } from "../interface";

export async function getTriviaById(id: string) {
  try {
    console.log(process.env.URL);
    const res: triviaResponse = await axios.get(
      `http://0.0.0.0:8095/api/v1.0/trivia/0`
    );
    console.log(id);
    console.log(res);
    return res;
  } catch (err) {
    console.error("err");
    return err;
  }
}
