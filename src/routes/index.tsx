import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center">
				<div className="relative max-w-5xl mx-auto">
					<p className="text-2xl text-gray-300 font-light">
						Welcome to your application
					</p>
				</div>
			</section>
		</div>
	);
}
