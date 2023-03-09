import express from 'express'
import http from "http"
import { Server } from "socket.io"
import morgan from "morgan"
import cors from "cors"
import { getTriviaById } from './controllers/trivia.controller'
require('dotenv').config();

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://127.0.0.1:5173',
  }
});

app.use(express.json())
app.use(cors())

app.use(morgan("dev"))

io.on('connection', (socket)=>{
  console.log('user connected')
  console.log(socket.id)

  socket.on("get-trivia", (data)=>{
    console.log("get-trivia", data)
    const res = getTriviaById(data.id)
    console.log({res})
    socket.emit("get-trivia-res", { res: res });
  })
})


console.log(process.env.PORT)

server.listen(process.env.PORT,()=>{
  console.log('listening on ' + process.env.PORT)
})