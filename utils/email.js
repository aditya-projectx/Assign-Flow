import SibApiV3Sdk from "sib-api-v3-sdk";

let apiInstance = null;

const getBrevo = () => {
  if (!apiInstance) {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not set");
    }

    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }
  return apiInstance;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const brevo = getBrevo();

    const response = await brevo.sendTransacEmail({
      sender: {
        email: "001.ak3207969@gmail.com",
        name: "University Portal",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log("📧 Email sent:", response.messageId);
    return response;
  } catch (err) {
    console.error("❌ Brevo email failed:", err);
    throw err;
  }
};
