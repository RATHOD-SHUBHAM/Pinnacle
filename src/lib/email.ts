import { Resend } from "resend";
import { SITE_NAME } from "@/lib/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendBookingConfirmation(params: {
  to: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  startAt: Date;
  endAt: Date;
}) {
  if (!resend || !process.env.EMAIL_FROM) {
    console.warn("[email] RESEND_API_KEY or EMAIL_FROM missing; skipping send.");
    return { skipped: true as const };
  }

  const start = params.startAt.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const end = params.endAt.toLocaleTimeString(undefined, { timeStyle: "short" });

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `Appointment confirmed — ${params.doctorName}`,
    html: `
      <p>Hi ${params.patientName},</p>
      <p>Your appointment is confirmed.</p>
      <ul>
        <li><strong>Doctor:</strong> ${params.doctorName} (${params.specialty})</li>
        <li><strong>When:</strong> ${start} – ${end}</li>
      </ul>
      <p>Please arrive a few minutes early. You can check in from your bookings page when you arrive.</p>
      <p style="margin-top:1.5rem;color:#666;font-size:14px;">${SITE_NAME}</p>
    `,
  });

  return { sent: true as const };
}
