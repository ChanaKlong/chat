import fs from "fs";

export default defineEventHandler(async (event) => {
  const {id} = await readBody(event);

  let file = fs.readFileSync(`${process.cwd()}/public/sound/${id}.wav`);
  let fileBlob = new Blob([file], {type: "audio/wav"});
  let formData = new FormData();
  formData.append("sound", fileBlob)

  const response = await fetch("https://806b-161-200-191-207.ngrok-free.app/enhance-voice/", {
    method: "POST",
    body: formData
  });

  const enhancedSound = await response.blob();

  if (!enhancedSound) {
    return {
      status: 500,
      error: "Failed to enhance sound"
    }
  }

  const enhancedWriter = fs.createWriteStream(`./public/converted/${id}.wav`);
  const enhancedReader = enhancedSound.stream().getReader();

  const enhancedWrite = async () => {
    const {done, value} = await enhancedReader.read();
    if (done) {
      enhancedWriter.end();
      return;
    }

    enhancedWriter.write(value);
    await enhancedWrite();
  };

  enhancedWrite().then(() => {
    return {
      status: 200,
      id
    }
  })
});