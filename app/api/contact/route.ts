import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactPayload {
  name: string;
  email: string;
  msg: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, msg } = body as ContactPayload;

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  if (!isValidEmail(email.trim())) {
    return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "livingstone23@gmail.com",
      subject: `[Arcade Vault] Nuevo mensaje de ${name.trim()}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name.trim()}</p>
        <p><strong>Email:</strong> ${email.trim()}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${msg.trim().replace(/\n/g, "<br>")}</p>
      `,
    });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email.trim(),
      subject: "Arcade Vault — Recibimos tu mensaje",
      html: `
        <h2>¡Hola, ${name.trim()}!</h2>
        <p>Recibimos tu mensaje correctamente. Te responderemos en 24-48 horas.</p>
        <p>Gracias por escribirnos.</p>
        <br>
        <p>— El equipo de Arcade Vault</p>
      `,
    }).catch((err: unknown) => {
      console.error("[contact] confirmation email failed:", err);
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[contact] resend error:", err);
    return NextResponse.json({ error: "Error al enviar el mensaje. Intenta de nuevo." }, { status: 500 });
  }
}
