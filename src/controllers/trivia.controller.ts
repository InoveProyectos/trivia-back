import axios from "axios";

export async function getTriviaById(id: string){
  try{
    const res = await axios.get(``)
    console.log(id)
    return res
  }catch (err){
    console.error("err")
    return err
  }
}