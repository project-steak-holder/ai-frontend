import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDialogStore } from "@/stores/dialogStore";
export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const openDialog = useDialogStore((state) => state.openDialog);

	return (
		<div className="bg-background text-foreground">
			<SignedIn>
				<section className="relative py-20 px-6 text-center">
					<div className="relative max-w-5xl mx-auto">
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
					</div>
				</section>
			</SignedIn>

			<SignedOut>
				<section className="relative py-20 px-6 text-center">
					<div className="relative max-w-3xl mx-auto">
						<h1 className="text-4xl sm:text-5xl font-bold mb-4">
							Practice with an AI stakeholder.
						</h1>
						<p className="text-lg text-muted-foreground mb-8">
							Stakeholder AI Chat lets you rehearse the conversations that
							matter — interviewing a client, pitching a feature, defending a
							design decision — with an AI that plays the role of a realistic
							project stakeholder.
						</p>
						<div className="flex justify-center gap-3">
							<Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
								<Button>Sign in to get started</Button>
							</Link>
						</div>
					</div>
				</section>

				<section className="px-6 pb-20 text-center">
					<p className="text-sm text-muted-foreground">
						A learning tool for academic use. Your conversations are private to
						your account.
					</p>
				</section>
			</SignedOut>
		</div>
	);
}
