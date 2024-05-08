import {
	DragDropProvider,
	DragDropSensors,
	type DragEventHandler,
	createDraggable,
	DragOverlay,
} from "@thisbeyond/solid-dnd";

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			draggable: ReturnType<typeof createDraggable>;
		}
	}
}

const Draggable = (props: { id: number }) => {
	const draggable = createDraggable(props.id);
	return (
		<div
			use:draggable={draggable}
			class="min-w-max p-1 rounded-full bg-blue-500 text-center whitespace-nowrap cursor-move absolute text-white"
			classList={{ "opacity-25": draggable.isActiveDraggable }}
			style={{ top: 0, left: (props.id === 1 ? 0 : 125) + "px" }}
		>
			Draggable {props.id}
		</div>
	);
};

export default function DragMoveExample() {
	let transform = { x: 0, y: 0 };

	const onDragMove: DragEventHandler = ({ overlay }) => {
		if (overlay) {
			transform = { ...overlay.transform };
		}
	};

	const onDragEnd: DragEventHandler = ({ draggable }) => {
		const node = draggable.node;
		node.style.setProperty("top", node.offsetTop + transform.y + "px");
		node.style.setProperty("left", node.offsetLeft + transform.x + "px");
	};

	return (
		<DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
			<DragDropSensors />
			<div class="min-h-15 w-full h-full relative">
				<Draggable id={1} />
				<Draggable id={2} />
			</div>
			<DragOverlay>
				{(draggable) => (
					<div class="draggable">{`Draggable ${draggable?.id}`}</div>
				)}
			</DragOverlay>
		</DragDropProvider>
	);
}
