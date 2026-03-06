import EmailTemplate from "@/components/email-template";
import { Resend } from "resend";
import * as React from "react";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { name, message } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kelsonqu@gmail.com",
      subject: name?.trim() ? `Message from ${name.trim()}` : "Message from contact form",
      react: EmailTemplate({
        message: message.trim(),
        name: name?.trim() || "Anonymous",
      }) as React.ReactElement,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
