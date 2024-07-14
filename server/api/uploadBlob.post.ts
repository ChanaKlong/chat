import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import fs, { writeFileSync } from "fs";
ffmpeg.setFfmpegPath(useRuntimeConfig().FFMPEG_PATH);

export default defineEventHandler(async (event) => {
  const blob = await readMultipartFormData(event);

  let nid = nanoid();
  let id = nid + ".wav";

  let file = new Blob([blob[0].data], {type: "audio/ogg"});
  let buffer = await file.arrayBuffer();
  writeFileSync(`${process.cwd()}/public/sound/${nid}.ogg`, Buffer.from(buffer));

  let command = ffmpeg();
  ffmpeg().input(`${process.cwd()}/public/sound/${nid}.ogg`)
  .output(`${process.cwd()}/public/sound/${id}`)
  .on("end",() => {
    if (fs.existsSync(`${process.cwd()}/public/sound/${id}`)) {
      $fetch("/api/enhanced", {
        method: "POST",
        body: JSON.stringify({id: nid}),
      }).then(() => {
        return {
          status: 200,
          id,
        }
      })
    }
  })
  .run()
});
