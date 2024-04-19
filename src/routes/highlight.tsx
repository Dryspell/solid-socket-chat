import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/Highlight/Entry"));
export default function MapControls() {
	return <ClientOnly />;
}
