import Stripe from "stripe";
import { IUser } from "../types/user";

export const createCheckout = async ({
    priceId,
    spaceId,
    mode,
    successUrl,
    cancelUrl,
    couponId,
    clientReferenceId,
    user,
  }: {
    priceId: string;
    mode: string;
    spaceId: string;
    successUrl: string;
    cancelUrl: string;
    couponId: string;
    clientReferenceId: string;
    user: IUser;
  }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY est requis');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const extraParams: Stripe.Checkout.SessionCreateParams = {};
  
    if (user?.customerId) {
      extraParams.customer = user.customerId;
    } else {
      if (mode === "payment") {
        extraParams.customer_creation = "always";
        // The option below costs 0.4% (up to $2) per invoice. Alternatively, you can use https://zenvoice.io/ to create unlimited invoices automatically.
        // extraParams.invoice_creation = { enabled: true };
        extraParams.payment_intent_data = { setup_future_usage: "on_session" };
      }
      if (user?.email) {
        extraParams.customer_email = user.email;
      }
      if (!couponId) {
        extraParams.allow_promotion_codes = true;
      }
      extraParams.tax_id_collection = { enabled: true };
    }
  
    const stripeSession = await stripe.checkout.sessions.create({
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      client_reference_id: clientReferenceId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: couponId
        ? [
            {
              coupon: couponId,
            },
          ]
        : [],
      metadata: {
        spaceId: spaceId,
      },
      subscription_data: {
        metadata: {
          spaceId: spaceId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...extraParams,
    });
  
    return stripeSession.url;
  };

export const findCheckoutSession = async (sessionId: string) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return session;
  } catch (e) {
    console.error(e);
    return null;
  }
};