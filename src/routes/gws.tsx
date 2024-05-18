import {
	DragDropProvider,
	DragDropSensors,
	type DragEventHandler,
	createDraggable,
	DragOverlay,
	type createDroppable,
	useDragDropContext,
} from "@thisbeyond/solid-dnd";
import {
	type Component,
	type ComponentProps,
	splitProps,
	type JSXElement,
	onMount,
	For,
} from "solid-js";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { createId } from "@paralleldrive/cuid2";
import { socket } from "~/lib/socket";
import { UnitData, type Position } from "~/types/game";

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			draggable: ReturnType<typeof createDraggable>;
			droppable: ReturnType<typeof createDroppable>;
		}
	}
}

const draggableClass =
	"min-w-max p-1 rounded-full bg-blue-500 text-center whitespace-nowrap cursor-move absolute text-white";

const DraggablePill = (props: { id: number }) => {
	const draggable = createDraggable(props.id);
	return (
		<div
			use:draggable={draggable}
			class={draggableClass}
			classList={{ "opacity-25": draggable.isActiveDraggable }}
			style={{
				top: `${(props.id % 3) * 125}px`,
				left: `${(props.id % 3) * 125}px`,
			}}
		>
			Draggable {props.id}
		</div>
	);
};

function DragArea() {
	const [state, actions] = useDragDropContext()!;
	const { draggables } = state;

	socket.on("connect", () => {
		console.log("connected to server!!");
	});

	socket.on("move", (unitData) => {
		console.log(unitData);
		const unit = draggables[unitData[0]];
		if (!unit) {
			console.log(draggables);
			return;
		}

		unit.node.style.top = `${unitData[1][0]}px`;
		unit.node.style.left = `${unitData[1][1]}px`;
	});

	let draggableAreaRef: HTMLDivElement | undefined;

	return (
		<div ref={draggableAreaRef} class="min-h-15 w-full h-full relative">
			<DraggablePill id={1} />
			<DraggablePill id={2} />

			<DragOverlay>
				<div class={draggableClass}>Drag Overlay</div>
			</DragOverlay>
		</div>
	);
}

export default function ServerDND() {
	let transform = { x: 0, y: 0 };

	const onDragMove: DragEventHandler = ({ overlay }) => {
		if (overlay) {
			transform = { ...overlay.transform };
		}
	};

	const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
		const newPosition: Position = [
			draggable.node.offsetTop + transform.y,
			draggable.node.offsetLeft + transform.x,
		];
		draggable.node.style.top = `${newPosition[0]}px`;
		draggable.node.style.left = `${newPosition[1]}px`;
		socket.emit("move", [draggable.id, newPosition]);
	};

	return (
		<DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
			<DragDropSensors />
			<DragArea />
		</DragDropProvider>
	);
}
