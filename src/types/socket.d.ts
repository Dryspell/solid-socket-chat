import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type {
	Server as IOServer,
	Server,
	Socket as SocketforServer,
} from "socket.io";
import type { Socket as SocketforClient } from "socket.io-client";
import { type UnitData } from "./game";

interface SocketServer extends HTTPServer {
	io?: IOServer;
}

export interface SocketWithIO extends NetSocket {
	server: SocketServer;
}

export interface ServerToClientEvents {
	"user-connected": (name: string) => void;
	"chat-message": (data: { message: string; name: string }) => void;
	"user-disconnected": (name: string) => void;
	move: (unitData: UnitData) => void;
}

export interface ClientToServerEvents {
	"new-user": (name: string) => void;
	"send-chat-message": (message: string) => void;
  "move": (unitData: UnitData) => void;
}

interface InterServerEvents {
	// ping: () => void;
}

interface SocketData {
	// user: {
	//   id: string;
	//   username: string;
	// };
}

export type sServer = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;
export type serverSocket = SocketforServer<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

export type clientSocket = SocketforClient<
	ServerToClientEvents,
	ClientToServerEvents
>;
