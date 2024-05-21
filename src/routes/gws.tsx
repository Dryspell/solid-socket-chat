import {
	DragDropProvider,
	DragDropSensors,
	type DragEventHandler,
	createDraggable,
	DragOverlay,
	createDroppable,
	useDragDropContext,
	type Id,
	Draggable,
} from "@thisbeyond/solid-dnd";
import { socket } from "~/lib/socket";
import { type Position } from "~/types/game";
import { createStore } from "solid-js/store";
import { For } from "solid-js";

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			draggable: ReturnType<typeof createDraggable>;
			droppable: ReturnType<typeof createDroppable>;
		}
	}
}

interface Base {
	id: Id;
	name: string;
	type: "group" | "item";
	order: string;
	color?: string;
}

interface Group extends Base {
	type: "group";
}

interface Item extends Base {
	type: "item";
	group: Id;
}

type Entity = Group | Item;

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
				top: `${Math.floor(props.id / 3) * 125}px`,
				left: `${(props.id % 3) * 125}px`,
			}}
		>
			Draggable {props.id}
		</div>
	);
};

const Droppable = (props: { id: number }) => {
	const droppable = createDroppable(props.id);
	return (
		<div
			ref={droppable.ref}
			class="droppable min-w-96 min-h-96 bg-gray-200 absolute rounded-lg border-2 border-dashed border-gray-400 text-center"
			classList={{ "!droppable-accept": droppable.isActiveDroppable }}
			style={{
				top: `${Math.floor(props.id / 3) * 350}px`,
				left: `${(props.id % 3) * 350}px`,
			}}
		>
			Droppable.
		</div>
	);
};

const setup = () => {
	const [draggables, setDraggables] = createStore<
		Record<Id, { id: number; name: string; position: Position }>
	>({
		1: {
			id: 1,
			name: "draggable 1",
			position: [0, 0],
		},
		2: {
			id: 2,
			name: "draggable 2",
			position: [0, 0],
		},
	});

	const [droppables, setDroppables] = createStore<
		Record<
			Id,
			{ id: number; name: string; position: Position; contains: number[] }
		>
	>({
		1: {
			id: 1,
			name: "droppable 1",
			position: [0, 0],
			contains: [],
		},
	});

	return { draggables, setDraggables, droppables, setDroppables };
};

function DragArea(
	props: ReturnType<typeof setup> & {
		draggableAreaRef: HTMLDivElement | undefined;
	}
) {
	const [state, actions] = useDragDropContext()!;

	socket.on("connect", () => {
		console.log("connected to server!!");
	});

	socket.on("move", (unitData) => {
		console.log(unitData);
		const unit = state.draggables[unitData[0]];
		if (!unit) {
			console.log(state.draggables);
			return;
		}

		props.setDraggables(unit.id, (draggable) => ({
			...draggable,
			position: [unitData[1][0], unitData[1][1]],
		}));

		unit.node.style.top = `${unitData[1][0]}px`;
		unit.node.style.left = `${unitData[1][1]}px`;

		if (
			!Object.values(state.droppables).some((droppable) => {
				const { x, y, width, height } =
					unit.node.getBoundingClientRect();

				const droppableRect = droppable.node.getBoundingClientRect();
				return (
					x >= droppableRect.x &&
					x + width <= droppableRect.x + droppableRect.width &&
					y >= droppableRect.y &&
					y + height <= droppableRect.y + droppableRect.height
				);
			})
		) {
			props.draggableAreaRef?.append(unit.node);
		}
	});

	return (
		<div
			ref={props.draggableAreaRef}
			class="min-h-15 w-full h-full relative"
		>
			<For each={Object.values(props.draggables)}>
				{(draggable) => <DraggablePill id={draggable.id} />}
			</For>
			<For each={Object.values(props.droppables)}>
				{(droppable) => <Droppable id={droppable.id} />}
			</For>

			<DragOverlay>
				<div class={draggableClass}>Drag Overlay</div>
			</DragOverlay>
		</div>
	);
}

export default function ServerDND() {
	const { draggables, droppables, setDraggables, setDroppables } = setup();

	let transform = { x: 0, y: 0 };

	const onDragMove: DragEventHandler = ({ overlay }) => {
		if (overlay) {
			transform = { ...overlay.transform };
		}
	};

	const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
		if (droppable) {
			draggable.node.style.top = "0px";
			draggable.node.style.left = "0px";
			droppable.node.append(draggable.node);
			setDroppables(droppable.id, (droppable) => ({
				...droppable,
				position: [droppable.position[0], droppable.position[1]],
			}));
			return;
		}

		const newPosition: Position = [
			draggable.node.offsetTop + transform.y,
			draggable.node.offsetLeft + transform.x,
		];
		socket.emit("move", [draggable.id, newPosition]);
	};

	let draggableAreaRef: HTMLDivElement | undefined;

	return (
		<DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
			<DragDropSensors />
			<DragArea
				draggableAreaRef={draggableAreaRef}
				draggables={draggables}
				setDraggables={setDraggables}
				droppables={droppables}
				setDroppables={setDroppables}
			/>
		</DragDropProvider>
	);
}
