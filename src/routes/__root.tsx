import { authClient } from "@integrations/neon-auth/client";
import TanStackQueryDevtools from "@integrations/tanstack-query/devtools";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { SideBar } from "@/components/SideBar";
import Header from "../components/Header";
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

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
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
					<div className="flex h-screen">
						<SideBar />
						<div className="flex-1 flex flex-col">
							<Header />
							<main className="flex-1 overflow-auto">{children}</main>
						</div>
					</div>
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</NeonAuthUIProvider>
				<Scripts />
			</body>
		</html>
	);
}
