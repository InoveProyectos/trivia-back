import express from 'express'
import http from "http"
import { Server } from "socket.io"

const app = express()
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json())

const PORT = 3000

app.get('/', (_req, res)=>{
  console.log('pingearon aca')
  res.send('pong')
})

io.on('connection', (socket)=>{
  console.log('user connected')
  console.log(socket)
})


server.listen(PORT,()=>{
  console.log('listening on 3000')
})