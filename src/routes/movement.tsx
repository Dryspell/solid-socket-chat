import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/Movement/Entry"));
export default function MapControls() {
	return <ClientOnly />;
}
