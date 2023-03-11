import axios from "axios";
import { triviaResponse } from "../interface";

export async function getTriviaById(id: string) {
  try {
    const res: triviaResponse = await axios.get(
      `${process.env.URL}/api/v1.0/trivia/${id}`
    );
    console.log(id);
    return res;
  } catch (err) {
    console.error("err");
    return err;
  }
}
