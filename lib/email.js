import { Resend } from "resend";

let _resend;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendDigestEmail(to, subject, reactElement) {
  const { data, error } = await getResend().emails.send({
    from: "Stackr <reminders@" + (process.env.RESEND_FROM_DOMAIN || "resend.dev") + ">",
    to,
    subject,
    react: reactElement,
  });
  if (error) throw new Error(error.message);
  return data;
}
