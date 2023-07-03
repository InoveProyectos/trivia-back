import axios from "axios";

export async function getUserByusername(data: any) {
  try {
    console.log(process.env.URL);
    //`http://0.0.0.0:8095/api/v1.0/trivia/${data.id}/user/${data.username}`
    const res = await axios.get(
      `http://0.0.0.0:8095/api/v1.0/trivia/0/user/${data.username}`
    );
    console.log(data);
    console.log(res);
    return res;
  } catch (err) {
    console.error("err");
    return err;
  }
}
