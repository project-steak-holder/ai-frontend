import {
	RedirectToSignIn,
	SignedIn,
	UserButton,
} from "@neondatabase/neon-js/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/integrations/neon-auth/client";
export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { data } = authClient.useSession();
	return (
		<div className="min-h-screen bg-background text-foreground">
			<section className="relative py-20 px-6 text-center">
				<div className="relative max-w-5xl mx-auto">
					<SignedIn>
						<p className="text-2xl text-gray-300 font-light">
							Welcome to your application
						</p>
						<div className="mt-6">
							<div className="flex justify-center mb-6">
								<UserButton />
							</div>
							<p className="mt-6">Session and User Data:</p>
							<pre className="flex-1 bg-secondary align-middle whitespace-pre-wrap wrap-break-word sm:max-w-2xl mx-auto text-left">
								<div className="mt-4 p-4">
									{JSON.stringify(
										{ session: data?.session, user: data?.user },
										null,
										2,
									)}
								</div>
							</pre>
						</div>
					</SignedIn>
					<RedirectToSignIn />
				</div>
			</section>
		</div>
	);
}
