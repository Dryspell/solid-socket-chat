import { createSignal, onMount } from "solid-js";

import { animationUpdate, init, load } from "./main";
import {
	initCharacters,
	initClickToMove,
	initSelectionBox,
} from "./characters";
import { constructScene } from "./scene";
import { initEffects } from "./effects";
import { initTestObjects } from "./test";

export default function Entry() {
	const [distanceReporter, setDistanceReporter] = createSignal(0);

	onMount(() => {
		const {
			scene,
			camera,
			cameraControls,
			renderer,
			clock,
			stats,
			composer,
			outlinePass,
		} = init();

		const characters = initCharacters();

		const animationCallbacks = new Map<string, () => void>([
			["stats", () => stats.update()],
			[
				"characterAnimations",
				() => {
					const mixerUpdateDelta = clock.getDelta();

					characters.forEach(({ mixer }) => {
						mixer.update(mixerUpdateDelta);
					});
				},
			],
			[
				"render",
				() => {
					composer
						? composer.render()
						: renderer.render(scene, camera);
				},
			],
		]);
    
		const animate = () => {
			animationCallbacks.forEach((callback) => callback());
			requestAnimationFrame(animate);
		};

		load().then(({ characterPrefabs }) => {
			const { groundMesh } = constructScene(
				scene,
				characters,
				characterPrefabs
			);
			// initTestObjects(scene);

			initClickToMove(
				camera,
				characters,
				groundMesh,
				animationCallbacks,
				setDistanceReporter
			);

			// initSelectionBox(
			// 	characters,
			// 	camera,
			// 	cameraControls,
			// 	scene,
			// 	renderer
			// );

			animate();
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
