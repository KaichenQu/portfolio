import { describe, it, expect, vi, beforeEach } from "vitest";

const { send, resendCtor } = vi.hoisted(() => ({
  send: vi.fn(),
  resendCtor: vi.fn(),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    constructor(apiKey?: string) {
      resendCtor(apiKey);
    }
  },
}));
vi.mock("@/components/email-template", () => ({
  default: ({ name, message }: { name: string; message: string }) => (
    <div>{`${name}: ${message}`}</div>
  ),
}));

import { POST } from "./route";

const request = (body: unknown) =>
  new Request("http://localhost/api/send", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test-key");
});

describe("POST /api/send", () => {
  it("sends the email and reports success", async () => {
    send.mockResolvedValue({ error: null });

    const res = await POST(request({ name: " Kelson ", message: " hello " }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(resendCtor).toHaveBeenCalledWith("test-key");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "onboarding@resend.dev",
        to: "kelsonqu@gmail.com",
        subject: "Message from Kelson",
      }),
    );
  });

  it("falls back to a generic subject when the name is blank", async () => {
    send.mockResolvedValue({ error: null });

    await POST(request({ name: "   ", message: "hi" }));

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Message from contact form" }),
    );
  });

  it("400s when the message is missing", async () => {
    const res = await POST(request({ name: "Kelson" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Message is required" });
    expect(send).not.toHaveBeenCalled();
  });

  it("400s when the message is only whitespace", async () => {
    const res = await POST(request({ message: "   " }));

    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("500s with the provider error message", async () => {
    send.mockResolvedValue({ error: { message: "domain not verified" } });

    const res = await POST(request({ message: "hi" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "domain not verified" });
  });

  it("500s when the provider throws", async () => {
    send.mockRejectedValue(new Error("network down"));

    const res = await POST(request({ message: "hi" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "network down" });
  });
});
