import {
	RedirectToSignIn,
	SignedIn,
} from "@neondatabase/neon-js/auth/react/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDialogStore } from "@/stores/dialogStore";
export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const openDialog = useDialogStore((state) => state.openDialog);

	return (
		<div className="bg-background text-foreground">
			<section className="relative py-20 px-6 text-center">
				<div className="relative max-w-5xl mx-auto">
					<SignedIn>
						<h1 className="text-4xl font-bold mb-4">
							Welcome to Stakeholder AI Chat
						</h1>
						<p className="text-lg text-muted-foreground mb-8">
							Your conversations are waiting. Select one from the sidebar or
							create a new one to get started.
						</p>
						<div className="w-[15%] min-w-fit h-20 mx-auto">
							<Button onClick={() => openDialog({ type: "conversation" })}>
								New Conversation
							</Button>
						</div>
					</SignedIn>
					<RedirectToSignIn />
				</div>
			</section>
		</div>
	);
}
