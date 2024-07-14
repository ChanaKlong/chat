import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export default defineEventHandler(async (event) => {
  const {files} = await readBody(event);
  const command = ffmpeg();
  command.setFfmpegPath(useRuntimeConfig().FFMPEG_PATH);

  let nid = nanoid();
  let id = nid + ".wav";

  let file = files[0];
  if (file.size > 1048576 * 2.5) {
    return {
      status: 500,
      error: `File size too large (2.5 MegaBytes Maximum)`,
    };
  }
  await storeFileLocally(
    file, // the file object
    nid, // you can add a name for the file or length of Unique ID that will be automatically generated!
    "/public/sound", // the folder the file will be stored in
  );
  ffmpeg().input(`${process.cwd()}/public/sound/${nid + "." + file.name.split(".").pop()}`)
    .output(`${process.cwd()}/public/sound/${id}`)
    .on("end", () => {
      if (fs.existsSync(`${process.cwd()}/public/sound/${id}`)) {
        $fetch("/api/enhanced", {
          method: "POST",
          body: JSON.stringify({id: nid}),
        }).then(() => {
          return {
            status: 200,
            id,
          };
        });
      }
    })
    .run();

});

interface File {
  name: string;
  content: string;
  size: number;
  type: string;
}
