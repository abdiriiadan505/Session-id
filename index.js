const express = require("express")
const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason
} = require("@whiskeysockets/baileys")

const qrcode = require("qrcode")
const P = require("pino")

const app = express()
const PORT = process.env.PORT || 3000

let latestQR = ""

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("session")

const sock = makeWASocket({
logger: P({ level: "silent" }),
auth: state
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async (update) => {

const { connection, qr } = update

if(qr){
latestQR = await qrcode.toDataURL(qr)
}

if(connection === "open"){
console.log("Bot connected to WhatsApp")
}

})

sock.ev.on("messages.upsert", async (m) => {

const msg = m.messages[0]

if(!msg.message) return

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text

if(text === "ping"){
await sock.sendMessage(msg.key.remoteJid,{text:"pong"})
}

})

}

startBot()

app.get("/", (req,res)=>{
res.sendFile(__dirname + "/main.html")
})

app.get("/qr",(req,res)=>{
res.send(`<img src="${latestQR}"/>`)
})

app.listen(PORT,()=>{
console.log("Server running on port " + PORT)
})
