import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import { getTriviaById } from "./controllers/trivia.controller";

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
  },
});

app.use(express.json());
app.use(cors());

app.use(morgan("dev"));

io.on("connection", (socket) => {
  console.log("user connected");
  console.log(socket.id);

  socket.on("get-triviaById", async (data) => {
    console.log({ data });
    try {
      const res: any = await getTriviaById(data.id);
      console.log({ res });
      res.status
        ? socket.emit("get-triviaById-res", { res: res })
        : socket.emit("get-triviaById-res", { err: "Hubo problemas" });
    } catch (err) {
      console.log(err);
      socket.emit("get-triviaById-res", { err: "Hubo problemas" });
    }
  });
});

console.log(process.env.PORT);

server.listen(process.env.PORT, () => {
  console.log("listening on " + process.env.PORT);
});
