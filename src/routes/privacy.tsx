import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
	return (
		<div className="bg-background text-foreground">
			<section className="py-12 px-6">
				<article className="mx-auto max-w-3xl prose-sm sm:prose prose-invert">
					<h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
					<p className="text-sm text-muted-foreground mb-8">
						Last updated: April 17, 2026
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						1. About This Policy
					</h2>
					<p className="mb-4">
						This Privacy Policy describes how steakholderagent.org ("we", "us",
						or "our") collects, uses, and safeguards information when you use
						our educational platform (the "Service"). The Service is provided
						for academic and educational purposes only.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						2. Information We Collect
					</h2>
					<p className="mb-2">
						We collect only what is necessary to operate the Service:
					</p>
					<ul className="list-disc pl-6 mb-4 space-y-1">
						<li>
							<strong>Account information</strong> you provide when signing up,
							such as your name and email address.
						</li>
						<li>
							<strong>Content you create</strong> while using the Service, such
							as conversations and messages.
						</li>
						<li>
							<strong>Basic technical data</strong> such as your browser type
							and access times, used to keep the Service running reliably.
						</li>
					</ul>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						3. How We Use Information
					</h2>
					<p className="mb-2">
						Your information is used{" "}
						<strong>solely for academic and educational purposes</strong>,
						specifically to:
					</p>
					<ul className="list-disc pl-6 mb-4 space-y-1">
						<li>Provide, maintain, and improve the Service.</li>
						<li>Authenticate you and secure your account.</li>
						<li>Support teaching, learning, and research activities.</li>
					</ul>
					<p className="mb-4">
						We do <strong>not</strong> sell your data, share it with
						advertisers, or use it for marketing or commercial profiling.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						4. Sharing of Information
					</h2>
					<p className="mb-4">
						We do not share your personal information with third parties except
						where required to operate the Service (for example, cloud
						infrastructure and authentication providers), to comply with
						applicable law, or to protect the rights and safety of our users.
						Service providers are bound to use your information only for the
						purposes described here.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">5. Data Retention</h2>
					<p className="mb-4">
						We retain your information for as long as your account is active or
						as needed to provide the Service. You may request deletion of your
						account and associated data at any time by contacting us.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">6. Data Security</h2>
					<p className="mb-4">
						We use reasonable technical and organizational measures to protect
						your information. No method of transmission or storage is perfectly
						secure, but we take safeguarding your data seriously.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
					<p className="mb-4">
						Depending on your jurisdiction, you may have the right to access,
						correct, export, or delete the personal information we hold about
						you. To exercise these rights, please contact us using the details
						below.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						8. Children's Privacy
					</h2>
					<p className="mb-4">
						The Service is intended for learners of appropriate age for its
						subject matter. If we learn that we have collected personal
						information from a child without verified parental or institutional
						consent, we will delete it.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">9. Cookies</h2>
					<p className="mb-4">
						We use cookies and similar technologies only to keep you signed in
						and to remember basic preferences. We do not use third-party
						advertising or cross-site tracking cookies.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">
						10. Changes to This Policy
					</h2>
					<p className="mb-4">
						We may update this Privacy Policy from time to time. When we do, we
						will revise the "Last updated" date above and, where appropriate,
						notify you through the Service.
					</p>

					<h2 className="text-xl font-semibold mt-8 mb-3">11. Contact</h2>
					<p className="mb-4">
						If you have questions about this Privacy Policy or your data, please
						contact us at aperez041@regis.edu.
					</p>
				</article>
			</section>
		</div>
	);
}
