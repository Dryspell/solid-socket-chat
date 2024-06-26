import { type APIEvent } from "@solidjs/start/server";
import { Server } from "socket.io";
import { type SocketWithIO, type sServer } from "~/types/socket";

type GameState = [];

export async function GET({ request, nativeEvent }: APIEvent) {
	const socket = nativeEvent.node.res.socket as SocketWithIO | null;
	if (!socket) return;
	if (socket.server.io) {
		console.log("Socket is already running " + request.url, request);
	} else {
		console.log("Initializing Socket");

		const io: sServer = new Server(socket.server, {
			path: "/api/ws",
		});

		socket.server.io = io;

		const users: Record<string, string> = {};

		const games: Record<string, GameState> = {};

		io.on("connection", (socket) => {
			socket.on("new-user", (name) => {
				users[socket.id] = name;
				socket.broadcast.emit("user-connected", name);
			});
			socket.on("disconnect", () => {
				socket.broadcast.emit("user-disconnected", users[socket.id]);
				delete users[socket.id];
			});
			socket.on("send-chat-message", (message) => {
				socket.broadcast.emit("chat-message", {
					message: message,
					name: users[socket.id],
				});
			});

			socket.on("move", (unitData) => {
				console.log("move", unitData);
				socket.emit("move", unitData);
				// socket.broadcast.emit("move", unitData);
			});
		});

		return new Response();
	}
}
