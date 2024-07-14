import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { Server } from "socket.io";
import { defineEventHandler } from "h3";
import { default as tts } from "@shofipwk/tiktok-tts";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
ffmpeg.setFfmpegPath(useRuntimeConfig().FFMPEG_PATH);

tts.config(useRuntimeConfig().TT_SSID);

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  const sp = [
    "en_male_ukneighbor",
    "en_us_002",
    "en_male_funny",
    "en_us_ghostface",
  ];

  io.sockets.on("connection", (socket) => {
    socket.on("joinRoom", (roomCode) => {
      socket.join(roomCode);
      socket.emit("joined");
    });

    socket.on("sendMsg", (msgData) => {
      let msgJSON = JSON.parse(msgData);
      if (msgJSON.id) {
        io.to(msgJSON.room).emit("newMsg", JSON.stringify(msgJSON));
        return;
      }
      let id = nanoid();
      tts
        .createAudioFromText(
          msgJSON.content,
          process.cwd() + `/public/sound/${id}`,
          sp[Math.floor(Math.random() * sp.length) - 1],
        )
        .then(() => {
          ffmpeg().input(process.cwd() + `/public/sound/${id}.mp3`)
            .output(`${process.cwd()}/public/sound/${id}.wav`)
            .on("end", () => {
              if (fs.existsSync(`${process.cwd()}/public/sound/${id}.wav`)) {
                $fetch("/api/enhanced", {
                  method: "POST",
                  body: JSON.stringify({ id }),
                }).then(() => {
                  msgJSON.id = id + ".wav";
                  io.to(msgJSON.room).emit("newMsg", JSON.stringify(msgJSON));
                })
              }
            })
            .run()

          // fs.unlinkSync(process.cwd() + `/public/sound/${id}.mp3`);
        });
    });
  });

  nitroApp.router.use(
    "/socket.io/",
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          const nodeContext = peer.ctx.node;
          const req = nodeContext.req;

          // @ts-expect-error private method
          engine.prepare(req);

          const rawSocket = nodeContext.req.socket;
          const websocket = nodeContext.ws;

          // @ts-expect-error private method
          engine.onWebSocket(req, rawSocket, websocket);
        },
      },
    }),
  );
});
