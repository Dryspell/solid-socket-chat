import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/SelectionBoxThree"));
export default function SelectionBox() {
	return <ClientOnly />;
}
