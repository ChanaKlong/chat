<script setup>
import { socket } from "~/components/socket";

const roomId = ref("");
const username = ref("");
const message = ref("");
const joinedStatus = ref(false)
const showVoice = ref(false);
const showUpload = ref(false);
const showInput = ref(true);
const msgLog = ref([
  {
    author: "Tin",
    timestamp: Date.now(),
    content: "Hello World!",
  },
]);

function joinRoom() {
  if (!username.value) {
    username.value = "Anonymous";
  }
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
              content: "(Sent a voice message)",
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
  <div class="grid grid-cols-1 justify-center place-items-center h-screen w-full">
    <div v-if="!joinedStatus" class="bg-white/20 p-6 rounded-md">
      <form @submit.prevent="joinRoom" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="room">Room ID</label>
          <input name="room" placeholder="general" type="text" v-model="roomId" class="input input-bordered w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="room">Username</label>
          <input name="username" placeholder="Anonymous" type="text" v-model="username" class="input input-bordered w-full" />
        </div>
        <input type="submit" class="w-full btn btn-primary" />
      </form>
    </div>
    <div v-else>
      <div class="mockup-phone h-screen w-[30vw]">
        <div class="camera"></div>
        <div class="display h-screen flex flex-col gap-2 relative">
          <center class="w-full bg-gray-500 text-xl py-3 pt-7 justify-center items-center">
            Room #{{ roomId }}
          </center>
          <div class="flex flex-col grow gap-4 overflow-scroll h-full">
            <div class="message-box" v-for="msg in msgLog">
              <div class="chat chat-start" v-if="msg.author !== username">
                <div class="chat-header">
                  {{ msg.author }}
                  <time class="text-xs opacity-50">{{ new Date(msg.timestamp).toLocaleTimeString() }}</time>
                </div>
                <div class="chat-bubble">{{ msg.content }}</div>
              </div>
              <div class="chat chat-end" v-else>
                <div class="chat-header">
                  {{ msg.author }}
                  <time class="text-xs opacity-50">{{ new Date(msg.timestamp).toLocaleTimeString() }}</time>
                </div>
                <div class="chat-bubble chat-bubble-success">{{ msg.content }}</div>
              </div>
            </div>
          </div>
          <div class="py-12 px-3 w-full">
            <div class="flex flex-row items-center justify-center gap-2 w-full">
              <div class="flex flex-row gap-2">
                <div class="btn btn-circle" v-if="!showInput" @click="showInput = !showInput; showUpload = !showInput; showVoice = !showInput">💬</div>
                <div class="btn btn-circle" v-if="!showUpload" @click="showUpload = !showUpload; showInput = !showUpload; showVoice = !showUpload">📩</div>
                <div class="btn btn-circle" v-if="!showVoice" @click="showVoice = !showVoice; showInput = !showVoice; showUpload = !showVoice">🎙️</div>
              </div>
              <form @submit.prevent="sendAudio" v-if="showUpload" class="grow">
                <input @input="handleFileInput" accept=".wav" type="file" />
                <input type="submit" />
              </form>
              <div class="flex flex-row gap-2 grow" v-if="showVoice">
                <button @click="audioRecord" id="record" class="btn btn-info">Record</button>
                <button id="stop" class="btn btn-error">Stop</button>
              </div>
              <form @submit.prevent="sendMsg" class="grow" v-if="showInput">
                <input type="text" v-model="message" class="input input-bordered w-full" />
              </form>
            </div>
          </div>
          <div class="absolute left-5 top-6">
            <button class="text-xl" onclick="window.location.reload()">🏠</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
