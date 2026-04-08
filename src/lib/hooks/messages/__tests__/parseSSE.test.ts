import { describe, expect, it, vi } from "vitest";

// Mock server-side modules before importing
vi.mock("@/server/api/messages/streamMessage", () => ({
	streamMessage: vi.fn(),
}));

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: null }),
		getSession: vi.fn(),
	},
}));

const { parseSSEEvent, parseSSEStream } = await import(
	"../useStreamingResponse"
);

// ---------------------------------------------------------------------------
// Helper: create a ReadableStream from an array of string chunks
// ---------------------------------------------------------------------------

function createStream(chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (index < chunks.length) {
				controller.enqueue(encoder.encode(chunks[index]));
				index++;
			} else {
				controller.close();
			}
		},
	});
}

async function collectStream(gen: AsyncGenerator<string>): Promise<string[]> {
	const results: string[] = [];
	for await (const chunk of gen) {
		results.push(chunk);
	}
	return results;
}

// ---------------------------------------------------------------------------
// parseSSEEvent
// ---------------------------------------------------------------------------

describe("parseSSEEvent", () => {
	it("returns null for empty string", () => {
		expect(parseSSEEvent("")).toBeNull();
	});

	it("returns null for whitespace-only string", () => {
		expect(parseSSEEvent("   ")).toBeNull();
	});

	it("returns null for invalid JSON", () => {
		expect(parseSSEEvent("not json")).toBeNull();
	});

	it("parses a partial event", () => {
		const result = parseSSEEvent('{"content":"hello","partial":true}');
		expect(result).toEqual({ content: "hello", partial: true });
	});

	it("parses a complete event", () => {
		const result = parseSSEEvent('{"complete":true}');
		expect(result).toEqual({ complete: true });
	});

	it("parses an error event", () => {
		const result = parseSSEEvent('{"error":"something failed"}');
		expect(result).toEqual({ error: "something failed" });
	});

	it("parses an error event with details", () => {
		const result = parseSSEEvent('{"error":"failed","details":{"code":500}}');
		expect(result).toEqual({ error: "failed", details: { code: 500 } });
	});

	it("trims whitespace before parsing", () => {
		const result = parseSSEEvent('  {"complete":true}  ');
		expect(result).toEqual({ complete: true });
	});
});

// ---------------------------------------------------------------------------
// parseSSEStream
// ---------------------------------------------------------------------------

describe("parseSSEStream", () => {
	it("yields content from partial events", async () => {
		const stream = createStream([
			'data:{"content":"Hello","partial":true}\n',
			'data:{"content":" World","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["Hello", " World"]);
	});

	it("stops on complete event", async () => {
		const stream = createStream([
			'data:{"content":"first","partial":true}\n',
			'data:{"complete":true}\n',
			'data:{"content":"should not appear","partial":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["first"]);
	});

	it("yields error message and stops on error event", async () => {
		const stream = createStream([
			'data:{"content":"start","partial":true}\n',
			'data:{"error":"something broke"}\n',
			'data:{"content":"after error","partial":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["start", "something broke"]);
	});

	it("handles data split across multiple chunks", async () => {
		const stream = createStream([
			'data:{"content":"He',
			'llo","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["Hello"]);
	});

	it("handles multiple events in a single chunk", async () => {
		const stream = createStream([
			'data:{"content":"A","partial":true}\ndata:{"content":"B","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["A", "B"]);
	});

	it("skips empty lines", async () => {
		const stream = createStream([
			'data:{"content":"test","partial":true}\n',
			"\n",
			"\n",
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["test"]);
	});

	it("handles lines without data: prefix", async () => {
		const stream = createStream([
			'{"content":"no prefix","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["no prefix"]);
	});

	it("returns empty array for empty stream", async () => {
		const stream = createStream([]);
		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual([]);
	});

	it("skips lines with invalid JSON", async () => {
		const stream = createStream([
			"data:not-json\n",
			'data:{"content":"valid","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["valid"]);
	});

	it("skips partial events with empty content", async () => {
		const stream = createStream([
			'data:{"content":"","partial":true}\n',
			'data:{"content":"real","partial":true}\n',
			'data:{"complete":true}\n',
		]);

		const results = await collectStream(parseSSEStream(stream));
		expect(results).toEqual(["real"]);
	});

	it("releases the reader lock after completion", async () => {
		const stream = createStream(['data:{"complete":true}\n']);

		const gen = parseSSEStream(stream);
		await collectStream(gen);

		// If the lock was released, we can get a new reader
		const reader = stream.getReader();
		expect(reader).toBeDefined();
		reader.releaseLock();
	});

	it("releases the reader lock after error event", async () => {
		const stream = createStream(['data:{"error":"fail"}\n']);

		const gen = parseSSEStream(stream);
		await collectStream(gen);

		const reader = stream.getReader();
		expect(reader).toBeDefined();
		reader.releaseLock();
	});
});
