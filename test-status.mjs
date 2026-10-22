import { io } from "socket.io-client";
const s = io("https://dropstream-backend.onrender.com", { transports: ["websocket"] });
s.on("connect", () => {
  console.log("connected");
  s.emit("check_pro_status", { email: "ak3807654@gmail.com" });
});
s.onAny((ev, ...a) => console.log(ev, JSON.stringify(a)));
setTimeout(() => process.exit(), 8000);
