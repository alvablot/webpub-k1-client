import { io } from "socket.io-client";

const $messBoard = document.getElementById("mess-board");
const $roomBoard = document.getElementById("room-board");
const $form = document.getElementById("form");
const $userName = document.getElementById("user-name");
const $connectBut = document.getElementById("connect-but");
const $createRoomBut = document.getElementById("create-room-but");
const $messIn = document.getElementById("mess-in");
const $roomIn = document.getElementById("room-in");
const $roomId = document.getElementById("room-id");
const $newRoomId = document.getElementById("new-room-id");
const $newRoom = document.getElementById("new-room");
const $panel = document.getElementById("panel");
const $userlist = document.getElementById("userlist");
const $passCheck = document.getElementById("passCheck");
const $emojiBoard = document.getElementById("emoji-board");
const $currentRoom = document.getElementById("mess-board2");
let password;
$roomId.value = "General";
$roomIn.value = "General";
let socket;
let userSocket;
let activeUsers = [];
let activeUser;
let activeRooms = [];
let currentRoom;
let rooms = [];
const emojis = [
  "🙂",
  "😀",
  "🤣",
  "😂",
  "😉",
  "😊",
  "😎",
  "🤓",
  "🥰",
  "😍",
  "😘",
  "😜",
  "🤗",
  "😐",
  "😕",
  "😒",
  "😪",
  "😡",
  "😈",
  "😺",
  "🐶",
  "💩",
  "💀",
  "👻",
  "🙈",
  "💋",
  "💖",
  "💯",
  "👍",
  "🙏",
  "🔥",
  "🌶",
  "🎉",
  "🍔",
  "🌮",
  "🚗",
];
let isUserCreated = false;

$userName.focus();

socket = io("http://localhost:3000");
userSocket = io("http://localhost:3000/user", {
  auth: { token: "test" },
});

socket.on("disconnect", () => {
  socket.emit("removeUser", socket.id);
});

userSocket.on("connect_error", (error) => {
  showMessage(error);
});

socket.on("sendToClient", (message, room) => {
  showMessage(message);
});

function directMess(userId, userName) {
  $roomId.value = userName;
  $roomIn.value = userId;
}

function removeUser(userId) {
  counter--;
  socket.emit("removeUser", userId);
}

function uppdateUsers(users) {
  activeUsers = users;
  let linkText;
  try {
    $userlist.innerHTML = "";
    users.forEach((element) => {
      const $div = document.createElement("div");
      const $a = document.createElement("a");
      let weight;
      if (element.id === socket.id) {
        isUserCreated = true;
        linkText = element.name + " ❌";
        $a.href = "#";
        $a.addEventListener("click", (e) => {
          $userName.readOnly = false;
          $userName.value = "";
          $userName.focus();
          removeUser(element.id);
          isUserCreated = false;
          socket.emit("remove", element.id);
          $panel.style.visibility = "hidden";
        });
        weight = "bold";
      } else {
        linkText = element.name + " 📩";
        $a.href = "#";
        $a.addEventListener("click", (e) => {
          directMess(element.id, element.name);
          $currentRoom.textContent = element.name;
          $roomId.value = element.id;
          joinRoom(element.name);
        });
      }
      $a.textContent = linkText;
      $userlist.append($div);
      $div.append($a);
      $a.style.fontWeight = weight;
    });
  } catch (error) {
    return;
  }
}
socket.on("sendMessagesToClient", (messages) => {
  updateMessages(messages);
});

socket.on("sendUserToClient", (users) => {
  uppdateUsers(users);
});

socket.on("sendRoomsToClient", (room) => {
  updateRooms(room);
});

socket.on("deletedRoomsToClient", (removeObject) => {
  const { user, room, message } = removeObject;
  $messBoard.innerHTML = "";
  const $div = document.createElement("div");
  $div.textContent = `${user}: ${message}`;
  $messBoard.append($div);
  $roomIn.value = "General";
  $roomId.value = "General";
  setTimeout(() => {
    joinRoom();
  }, 2000);
});

///////////////////////////MESSAGES
function updateMessages(messages) {
  let name;
  let room;
  updateScroll($messBoard);
  $messBoard.innerHTML = "";
  messages.forEach((message) => {
    let r = Math.round(Math.random() * 255) - 100;
    let g = Math.round(Math.random() * 255) - 100;
    let b = Math.round(Math.random() * 255) - 100;
    let color = `rgb(${r},${g},${b})`;
    name = message.user;
    room = message.room;
    const $div = document.createElement("div");
    $div.textContent = `${name}: ${message.message}`;
    $messBoard.append($div);
    $div.style.color = color;
  });
}

emojis.forEach((emoji) => {
  const $emoji = document.createElement("span");
  $emoji.textContent = emoji;
  $emojiBoard.append($emoji);
  $emoji.addEventListener("click", () => {
    $messIn.value += $emoji.textContent;
  });
});

let cancel = false;
$messIn.addEventListener("keydown", (e) => {
  if (cancel) return;
  else {
    usertyping();
    cancel = true;
    setTimeout(() => {
      cancel = false;
    }, 1000);
  }
});

function usertyping() {
  socket.emit("typingToServer", activeUser, $roomIn.value);
}

socket.on("typingToClient", (user) => {
  const $div = document.createElement("div");
  $div.textContent = `${user} ...skriver`;
  $div.style.color = "#aaaaaa";
  $messBoard.append($div);
  setTimeout(() => {
    $div.remove();
  }, 1000);
});

function showMessage(message) {
  let r = Math.round(Math.random() * 255) - 100;
  let g = Math.round(Math.random() * 255) - 100;
  let b = Math.round(Math.random() * 255) - 100;
  let color = `rgb(${r},${g},${b})`;
  const $div = document.createElement("div");
  $div.textContent = message;
  $messBoard.append($div);
  $div.style.color = color;
}

function updateScroll(obj) {
  obj.scrollTop = obj.scrollHeight - 100;
}

$form.addEventListener("submit", (e) => {
  e.preventDefault;
  $userName.readonly = true;
  updateScroll($messBoard);
  const userName = $userName.value === "" ? "Anonymouse" : $userName.value;
  const userId = socket.id;
  activeUser = userName;
  const message = $messIn.value;
  const room = $roomIn.value;
  if (message === "") return;
  showMessage("Me: " + message);
  socket.emit("sendToServer", message, room, userName, userId);
  $messIn.value = "";
});

///////////////////////////USERS
let counter = 0;
function connectUser() {
  joinRoom();
  $panel.style.visibility = "visible";
  let userName;
  if (counter === 0) {
    const userName = $userName.value === "" ? "Anonymouse" : $userName.value;
    activeUser = userName;
    $userName.value = userName;
    const userId = socket.id;
    socket.emit("sendUsersToServer", userId, userName);
    ++counter;
  }
}

$connectBut.addEventListener("click", () => {
  $userName.readOnly = true;
  connectUser();
});
///////////////////////////ADD ROOM TO LIST

let rCounter = 1;
function updateRooms(rooms) {
  activeRooms = rooms;
  try {
    $roomBoard.innerHTML = "";
    let roomName = rooms[0].name;
    if (roomName === "") roomName = "New Room " + rCounter;
    const roomId = $newRoomId.value;
    activeRooms.forEach((room, i) => {
      const $div = document.createElement("div");
      const $a = document.createElement("a");
      $a.href = "#";
      $div.id = `room-${i}`;
      $roomBoard.append($div);
      $a.textContent = room.name;
      $div.append($a);
      if (room.password === null) {
        $a.addEventListener("click", (e) => {
          $roomIn.value = room.name;
          $roomId.value = room.name;
          joinRoom();
        });
      } else {
        $a.addEventListener("click", (e) => {
          const password = prompt("You need a password to join this room");
          if (password === room.password) {
            $roomIn.value = room.name;
            $roomId.value = room.name;
            joinRoom();
          }
        });
      }
      if (i > 0) {
        const $deleteRoom = document.createElement("a");
        $deleteRoom.href = "#";
        if (room.password === null) {
          $deleteRoom.innerHTML = " 🗑 ";
          $div.append($deleteRoom);
          $deleteRoom.addEventListener("click", (e) => {
            deleteRoom(room.name, $div.id);
            $roomIn.value = "General";
            $roomId.value = "General";
            joinRoom();
          });
        } else {
          $deleteRoom.innerHTML = " 🔒";
          $div.append($deleteRoom);
          $deleteRoom.addEventListener("click", (e) => {
            const password = prompt("Yoy need a password to delete this room");
            if (password === room.password) {
              deleteRoom(room.name, $div.id);
              $roomIn.value = "General";
              $roomId.value = "General";
              joinRoom();
            } else return;
          });
        }
      }
    });
    ++rCounter;
  } catch (error) {
    if (error) return;
  }
}

let passworsSet = false;
$createRoomBut.addEventListener("click", () => {
  if ($passCheck.checked) {
    const password = prompt("Choose password");
    if (password === "") return;
    let roomName = "Room " + activeRooms.length;
    socket.emit("sendRoomToServer", socket.id, roomName, password);
  } else {
    let roomName = "Room " + activeRooms.length;
    socket.emit("sendRoomToServer", socket.id, roomName);
  }
});

///////////////////////////CREATE ROOM/DIRECT MESSAGE
function deleteRoom(roomName, id) {
  const $element = document.getElementById(id);
  socket.emit("deleteRoomFromDb", socket.id, roomName);
}

function joinRoom(name) {
  let newRoom;
  const room = $roomIn.value;
  currentRoom = room;
  if (name !== undefined) $currentRoom.textContent = "DM to " + name;
  else {
    $currentRoom.textContent = currentRoom;
  }
  socket.emit("joinRoom", room, name, (message) => {
    showMessage(message);
    newRoom = {
      message: message,
      name: room,
    };
    rooms.push(newRoom);
  });
}
///////////////////////////ONLOAD
window.addEventListener("load", () => {
  const userName = $userName.value;
  const userId = socket.id;
  const room = $roomIn.value === "" ? "General" : $roomIn.value;
  socket.emit("getRooms", room);
  socket.emit("getUsers", room);
  socket.emit("getMessages", room);
  socket.emit("logIn", userName);
  joinRoom();
});
