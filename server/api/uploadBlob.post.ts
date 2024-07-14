import { nanoid } from "nanoid";
import { writeFile } from "fs";

export default defineEventHandler(async (event) => {
  const blob = await readMultipartFormData(event);

  let nid = nanoid();
  let id = nid + ".ogg";

  let file = new Blob([blob[0].data], { type: "audio/ogg" });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFile(`${process.cwd()}/public/sound/${id}`, buffer, () =>
      console.log("audio saved!"),
    );
    return {
      status: 200,
      id,
    };
  } catch (err) {
    return {
      status: 500,
      error: `Error saving file: ${err}`,
    };
  }
});
