import ChatBox from "~/components/ChatBox";
import { socket } from "~/lib/socket";
import ChatMessages from "../components/chatMessages";

export default function ChatPage() {
	socket.on("connect", () => {
		console.log("connected to server!!");
	});

	return (
		<main>
			<h1>Chat</h1>
			{/* <ChatMessages /> */}
			<ChatBox />
		</main>
	);
}
