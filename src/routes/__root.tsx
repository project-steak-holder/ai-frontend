import { authClient } from "@integrations/neon-auth/client";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";

import { RootErrorBoundary } from "@/components/error-handling/RootErrorBoundary";
import { RouteErrorBoundary } from "@/components/error-handling/RouteErrorBoundary";
import { SideBar } from "@/components/layout/SideBar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "../components/layout/Header";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Stakeholder AI Chat",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,

	notFoundComponent: () => (
		<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
			Page not found.
		</div>
	),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<RootErrorBoundary>
					<NeonAuthUIProvider
						authClient={authClient}
						defaultTheme="dark"
						social={{ providers: ["google"] }}
						credentials={{
							rememberMe: true,
							forgotPassword: true,
							username: true,
							usernameRequired: true,
						}}
					>
						<TooltipProvider>
							<div className="flex h-screen">
								<SideBar />
								<div className="flex-1 flex flex-col">
									<Header />
									<main className="flex-1 overflow-auto">{children}</main>
									<Toaster />
								</div>
							</div>
						</TooltipProvider>
					</NeonAuthUIProvider>
				</RootErrorBoundary>
				<Scripts />
			</body>
		</html>
	);
}
