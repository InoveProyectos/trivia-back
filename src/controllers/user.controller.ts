import axios from "axios";

export async function getUserByusername(username: string) {
  try {
    console.log(process.env.URL);
    const res = await axios.get(
      `http://0.0.0.0:8095/api/v1.0/trivia/0/user/${username}`
    );
    console.log(username);
    console.log(res);
    return res;
  } catch (err) {
    console.error("err");
    return err;
  }
}
