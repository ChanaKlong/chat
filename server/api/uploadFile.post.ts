import { nanoid } from "nanoid";

export default defineEventHandler(async (event) => {
  const { files } = await readBody(event);

  console.log(files);
  let nid = nanoid();
  let id = nid + "." + files[0].name.split(".").pop();

  for (const file of files) {
    if (file.size > 1048576 * 2.5) {
      return {
        status: 500,
        error: `File size too large (2.5 MegaBytes Maximum)`,
      };
    }
    if (!["audio/wav", "audio/x-wav", "audio/ogg"].includes(file.type)) {
      return {
        status: 500,
        error: `.wav/.ogg files only`,
      };
    }
    await storeFileLocally(
      file, // the file object
      nid, // you can add a name for the file or length of Unique ID that will be automatically generated!
      "/public/sound", // the folder the file will be stored in
    );
  }

  return {
    status: 200,
    id,
  };
});

interface File {
  name: string;
  content: string;
  size: number;
  type: string;
}
