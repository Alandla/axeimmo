import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Contact information: marc@shipfa.st
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://shipfa.st/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Button variant="link" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
          Back
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for Hoox
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`TERMS OF SERVICE

Last Updated: December 14, 2023

1. ACCEPTANCE OF TERMS

By accessing and using Hoox (https://hoox.video), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our services.

2. DESCRIPTION OF SERVICE

Hoox provides AI-powered video generation services for social media content ("Service"). We reserve the right to modify, suspend, or discontinue the Service at any time.

3. USER ACCOUNTS

3.1. You must provide accurate, current, and complete information when creating an account.
3.2. You are responsible for maintaining the confidentiality of your account credentials.

4. PAYMENT TERMS

4.1. Prices are subject to change with notice.
4.2. All payments are non-refundable unless otherwise specified.
4.3. You agree to provide current, complete, and accurate payment information.

5. USER CONTENT AND CONDUCT

5.1. You retain full ownership of all content generated through our Service.
5.2. You are solely responsible for your use of the Service and any content you create.
5.3. Prohibited content includes but is not limited to:
   - Illegal content
   - Fraudulent or misleading content
   - Hate speech
   - Explicit adult content
   - Content that infringes on intellectual property rights
   - Content promoting violence or terrorism

6. INTELLECTUAL PROPERTY

6.1. Hoox retains all rights to the Service, including software, features, and interfaces.
6.2. Users may not copy, modify, distribute, sell, or lease any part of our Service.

7. LIMITATION OF LIABILITY

7.1. The Service is provided "as is" without warranties of any kind.
7.2. Hoox shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
7.3. Our maximum liability shall not exceed the amount paid by you for the Service in the past 12 months.

8. INDEMNIFICATION

You agree to indemnify and hold Hoox harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.

9. TERMINATION

9.1. We may terminate or suspend your account for any reason, including violation of these Terms.
9.2. You may terminate your account at any time by contacting us.

10. MODIFICATIONS TO TERMS

We reserve the right to modify these Terms at any time. Users will be notified of changes via email.

11. GOVERNING LAW

These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflicts of law principles.

12. DISPUTE RESOLUTION

Any dispute arising from these Terms shall be resolved through binding arbitration.

13. SEVERABILITY

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in effect.

14. CONTACT INFORMATION

For questions about these Terms, contact us at:
Email: contact@hoox.video

15. ENTIRE AGREEMENT

These Terms constitute the entire agreement between you and Hoox regarding the Service.

By using Hoox, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
