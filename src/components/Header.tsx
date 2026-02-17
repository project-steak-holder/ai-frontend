import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="p-4 flex items-center bg-card text-card-foreground border-b border-border shadow-sm">
			<h1 className="text-xl font-semibold">
				<Link to="/" className="hover:text-primary transition-colors">
					AI Stakeholder Chat
				</Link>
			</h1>
		</header>
	);
}
