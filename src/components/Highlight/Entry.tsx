import { onMount } from "solid-js";
import { animate, init } from "./main";

export default function Entry() {
	onMount(() => {
		const {
			camera,
			scene,
			renderer,
			composer,
			controls,
			gui,
			params,
			stats,
			group,
		} = init();
		animate(controls, composer, params, stats, group);
	});

	return (
		<div
			style={{
				"background-color": "#f0f0f0",
				color: "#000",
				"touch-action": "none",
			}}
		>
			<div
				style={{
					position: "absolute",
					width: "100vw",
					height: "100vh",
				}}
				id="container"
			/>
		</div>
	);
}
