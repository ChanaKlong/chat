<script setup>
import { socket } from "~/components/socket";

const roomId = ref("");
const username = ref("");
const message = ref("");
const joinedStatus = ref(false);
const msgLog = ref([
  {
    author: "Tin",
    timestamp: Date.now(),
    content: "Hello World!",
  },
]);

function joinRoom() {
  if (!roomId.value) {
    roomId.value = "general";
    socket.emit("joinRoom", roomId.value);
    return;
  }
  if (
    !/^\w+$/.test(roomId.value) ||
    roomId.value.length > 32 ||
    username.value.length > 128
  ) {
    roomId.value = "";
    username.value = "";
    return;
  }
  socket.emit("joinRoom", roomId.value);
}

function sendMsg() {
  if (message.value.length > 200) {
    message.value = "";
    new Audio("/sound/2long.mp3").play();
    return alert("Yao pai kub pee (200 characters maximum)");
  } else if (!/^[a-zA-Z0-9!@$%&*()-=_'", ]*$/.test(message.value)) {
    message.value = "";
    new Audio("/sound/static.mp3").play();
    return alert("Phasa Anglish Only");
  } else if (!message.value.length) {
    return;
  }
  socket.emit(
    "sendMsg",
    JSON.stringify({
      room: roomId.value,
      author: username.value,
      timestamp: Date.now(),
      content: message.value,
    }),
  );
  message.value = "";
}

socket.on("joined", () => {
  joinedStatus.value = true;
});

socket.on("newMsg", (msgData) => {
  let msgJSON = JSON.parse(msgData);
  msgLog.value.push(msgJSON);
  new Audio("/sound/" + msgJSON.id).play();
});
const { handleFileInput, files } = useFileStorage();
const sendAudio = async () => {
  const response = await $fetch("/api/uploadFile", {
    method: "POST",
    body: {
      files: files.value,
    },
  });

  if (response.status === 500) {
    return alert(response.error);
  }

  socket.emit(
    "sendMsg",
    JSON.stringify({
      room: roomId.value,
      author: username.value,
      timestamp: Date.now(),
      content: "(Sent an audio file)",
      id: response.id,
    }),
  );
};

function audioRecord() {
  let record = document.getElementById("record");
  let stop = document.getElementById("stop");
  if (navigator.mediaDevices) {
    const constraints = { audio: true };
    let chunks = [];

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        record.style.background = "red";
        record.style.color = "black";

        stop.onclick = () => {
          mediaRecorder.stop();
          console.log(mediaRecorder.state);
          console.log("recorder stopped");
          record.style.background = "";
          record.style.color = "";
        };

        mediaRecorder.onstop = async (e) => {
          console.log("data available after MediaRecorder.stop() called.");

          const audio = document.createElement("audio");
          audio.controls = true;
          const blob = new Blob(chunks, { type: "audio/ogg" });
          chunks = [];

          let formData = new FormData();
          formData.append("audio", blob);

          const response = await $fetch("/api/uploadBlob", {
            method: "POST",
            body: formData,
          });

          if (response.status === 500) {
            return alert(response.error);
          }

          socket.emit(
            "sendMsg",
            JSON.stringify({
              room: roomId.value,
              author: username.value,
              timestamp: Date.now(),
              content: "(Sent an audio file)",
              id: response.id,
            }),
          );
        };

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
      })
      .catch((err) => {
        console.error(`The following error occurred: ${err}`);
      });
  }
}
</script>

<template>
  <div v-if="!joinedStatus">
    <form @submit.prevent="joinRoom">
      <label for="room">Room ID</label>
      <input name="room" type="text" v-model="roomId" />
      <label for="room">Username</label>
      <input name="username" type="text" v-model="username" />
      <input type="submit" />
    </form>
  </div>
  <div v-else>
    Room #{{ roomId }}
    <div class="messages">
      <div class="message-box" v-for="msg in msgLog">
        <div class="from">
          {{ msg.author }}
        </div>
        <div class="message-body">
          {{ msg.content }}
        </div>
      </div>
    </div>
    <div class="input-box">
      <form @submit.prevent="sendMsg">
        <input type="text" v-model="message" />
        <input type="submit" />
      </form>
      <form @submit.prevent="sendAudio">
        <input @input="handleFileInput" accept=".wav" type="file" />
        <input type="submit" />
      </form>
      <button @click="audioRecord" id="record">Record</button>
      <button id="stop">Stop</button>
    </div>
  </div>
</template>
