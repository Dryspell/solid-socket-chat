import {
	DragDropProvider,
	DragDropSensors,
	type DragEventHandler,
	createDraggable,
	DragOverlay,
	createDroppable,
} from "@thisbeyond/solid-dnd";
import {
	type Component,
	type ComponentProps,
	splitProps,
	type JSXElement,
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

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			draggable: ReturnType<typeof createDraggable>;
			droppable: ReturnType<typeof createDroppable>;
		}
	}
}

const DraggablePill = (props: { id: number }) => {
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

const Draggable = (props: {
	id?: string | number;
	top?: 0 | string;
	left?: 0 | string;
	children: JSXElement;
}) => {
	const id = props.id ?? createId();
	const draggable = createDraggable(id);
	return (
		<>
			<div
				use:draggable={draggable}
				class="draggable cursor-move absolute"
				classList={{ "opacity-25": draggable.isActiveDraggable }}
				style={{ top: props.top, left: props.left }}
			>
				{props.children}
			</div>
			<DragOverlay>
				{(draggable) => (draggable?.id === id ? props.children : null)}
			</DragOverlay>
		</>
	);
};

type CardData = {} & Record<string, unknown>;

const DraggableCard: Component<
	{
		id?: string;
		title?: JSXElement;
		description?: JSXElement;
		content?: JSXElement;
		footer?: JSXElement;
		data?: CardData;
	} & ComponentProps<"div">
> = (props) => {
	const [, rest] = splitProps(props, [
		"style",
		"class",
		"title",
		"content",
		"description",
		"footer",
	]);

	return (
		<Draggable
			id={props.id}
			top={
				typeof props.style !== "string" ? props?.style?.top : undefined
			}
			left={
				typeof props.style !== "string" ? props?.style?.left : undefined
			}
		>
			<Card class="min-w-40 max-w-40 absolute" {...rest}>
				<CardHeader>
					<CardTitle>{props.title ?? "Card Title"}</CardTitle>
					<CardDescription>
						{props.description ?? "Card Description"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{props.content ?? <p>Card Content</p>}
				</CardContent>
				<CardFooter>{props.footer ?? <p>Card Footer</p>}</CardFooter>
			</Card>
		</Draggable>
	);
};

const Droppable = () => {
	const droppable = createDroppable(1);
	return (
		<div
			ref={droppable.ref}
			class="droppable min-w-96 min-h-96 bg-gray-200 absolute rounded-lg border-2 border-dashed border-gray-400 text-center"
			classList={{ "!droppable-accept": droppable.isActiveDroppable }}
			style={{ left: "350px", top: "350px" }}
		>
			Droppable.
		</div>
	);
};

export default function DragMoveExample() {
	let transform = { x: 0, y: 0 };
	let ref: HTMLDivElement | undefined;

	const onDragMove: DragEventHandler = ({ overlay }) => {
		if (overlay) {
			transform = { ...overlay.transform };
		}
	};

	const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
		if (droppable) {
			droppable.node.append(draggable.node);
		} else {
			ref?.append(draggable.node);
			draggable.node.style.setProperty(
				"top",
				draggable.node.offsetTop + transform.y + "px"
			);
			draggable.node.style.setProperty(
				"left",
				draggable.node.offsetLeft + transform.x + "px"
			);
		}
	};

	return (
		<DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
			<DragDropSensors />
			<div ref={ref} class="min-h-15 w-full h-full relative">
				<DraggablePill id={1} />
				<DraggablePill id={2} />
				<DraggableCard
					style={{
						top: 0,
						left: `${325}px`,
					}}
				/>
				<Droppable />
			</div>
		</DragDropProvider>
	);
}
