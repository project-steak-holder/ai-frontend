import { UserButton } from "@neondatabase/neon-js/auth/react";

export default function Header() {
	return (
		<header className="h-16 p-4 flex items-center bg-card text-card-foreground border-b border-border shadow-sm">
			<div className="ml-auto mt-auto">
				<UserButton size={"icon"} />
			</div>
		</header>
	);
}
