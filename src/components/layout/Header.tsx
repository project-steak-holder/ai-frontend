import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function Header() {
	return (
		<header className="p-4 flex items-center bg-card text-card-foreground border-b border-border shadow-sm">
			<div className="flex items-center space-x-4">
				<h1 className="text-xl font-semibold">
					<Link to="/" className="hover:text-primary transition-colors">
						AI Stakeholder Chat
					</Link>
				</h1>
			</div>

			{/* Your new settings button */}
			<div className="ml-auto flex items-center space-x-2">
				<Button variant="outline" size="sm">
					Settings
				</Button>
			</div>
		</header>
	);
}
