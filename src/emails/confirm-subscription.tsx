// The double-opt-in confirmation email, built with React Email.
// Preview locally with `npx email dev` if you want to restyle it.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

interface ConfirmSubscriptionEmailProps {
  siteName: string;
  confirmUrl: string;
}

export default function ConfirmSubscriptionEmail({
  siteName,
  confirmUrl,
}: ConfirmSubscriptionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your subscription to {siteName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={heading}>{siteName}</Text>
            <Text style={paragraph}>
              Thanks for following! Click the button below to confirm your
              email and unlock the feed.
            </Text>
            <Button href={confirmUrl} style={button}>
              Confirm my email
            </Button>
            <Text style={muted}>
              This link expires in 24 hours. If you didn&apos;t request this,
              you can safely ignore this email — nothing will happen.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              You received this because someone entered your email at{" "}
              {siteName}. No confirmation, no emails — ever.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "40px 16px",
};

const container = {
  backgroundColor: "#161616",
  borderRadius: "16px",
  border: "1px solid #2a2a2a",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "32px",
};

const heading = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
};

const paragraph = {
  color: "#d4d4d4",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "9999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
};

const muted = {
  color: "#737373",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
};

const hr = { borderColor: "#2a2a2a", margin: "24px 0" };

const footer = {
  color: "#525252",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};
