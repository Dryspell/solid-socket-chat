import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/gltfModel"));
export default function MapControls() {
	return <ClientOnly />;
}
