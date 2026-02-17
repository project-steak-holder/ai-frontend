import { AccountView } from "@neondatabase/neon-js/auth/react/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/$pathname")({
	component: Account,
});

function Account() {
	const { pathname } = Route.useParams();
	return (
		<div className="flex items-center justify-center min-h-screen p-4">
			<AccountView
				pathname={pathname}
				classNames={{
					base: "w-full max-w-6xl rounded-lg p-6 bg-sidebar text-sidebar-foreground",
				}}
			/>
		</div>
	);
}
