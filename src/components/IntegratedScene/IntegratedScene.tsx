import { onMount } from "solid-js";

import { animate, init, load } from "./main";
import { initCharacterPrefabs, initCharacters } from "./characters";
import { constructScene } from "./scene";

export default function IntegratedScene() {
	onMount(() => {
		const { scene, camera, renderer, clock, stats } = init();

		const characterPrefabs = initCharacterPrefabs();
		const characters = initCharacters();

		constructScene(scene, camera, characters, characterPrefabs);

		animate(scene, camera, renderer, clock, stats, characters);
		load(characterPrefabs);
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
