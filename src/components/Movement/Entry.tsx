import { createSignal, onMount } from "solid-js";

import { animate, init, load } from "./main";
import { initCharacters, initClickToMove } from "./characters";
import { constructScene } from "./scene";

export default function Entry() {
	const [distanceReporter, setDistanceReporter] = createSignal(0);

	onMount(() => {
		const { scene, camera, renderer, clock, stats } = init();

		const characters = initCharacters();
		const animationCallbacks = new Map<string, () => void>();

		load().then(({ characterPrefabs }) => {
			animate(
				scene,
				camera,
				renderer,
				clock,
				stats,
				characters,
				animationCallbacks
			);
			const { groundMesh } = constructScene(
				scene,
				characters,
				characterPrefabs
			);

			initClickToMove(
				camera,
				characters,
				groundMesh,
				animationCallbacks,
				setDistanceReporter
			);
		});
	});

	return (
		<div
			style={{
				"background-color": "#f0f0f0",
				color: "#000",
				"touch-action": "none",
			}}
		>
			<div style={{ position: "absolute", top: 0, right: 0 }}>
				<div>Distance: {distanceReporter().toFixed(2)}</div>
			</div>
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
