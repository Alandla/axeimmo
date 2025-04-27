import { getUserById } from "@/src/dao/userDao";
import { auth } from "@/src/lib/auth";
import { trackAddToCartFacebook } from "@/src/lib/facebook";
import { createCheckout } from "@/src/lib/stripe";
import { NextResponse } from "next/server";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// By default, it doesn't force users to be authenticated. But if they are, it will prefill the Checkout data with their email and/or credit card
export async function POST(req: Request) {
  const params = await req.json();

  if (!params.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!params.successUrl || !params.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!params.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    const session = await auth();

    console.log("POST /api/stripe/createCheckout by user: ", session?.user?.id);

    let user;
    if (session && session.user && session.user.id) {
      user = await getUserById(session.user.id);
    }

    const { priceId, mode, couponId, successUrl, cancelUrl, spaceId, toltReferral, fbc, fbp, price, currency } = params;

    if (fbc || fbp) {
      trackAddToCartFacebook(user?.email, user?.id?.toString(), price, currency, fbc, fbp);
    }

    const stripeSessionURL = await createCheckout({
      priceId,
      spaceId,
      mode,
      successUrl,
      couponId,
      cancelUrl,
      toltReferral,
      // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
      clientReferenceId: user?._id?.toString(),
      // If user is logged in, this will automatically prefill Checkout data like email and/or credit card for faster checkout
      user,
      fbc,
      fbp,
    });

    if (!stripeSessionURL) {
      console.error("L'URL de session Stripe est undefined");
      return NextResponse.json({ error: 'URL de session non générée' }, { status: 500 });
    }

    return NextResponse.json({ data: stripeSessionURL });
  } catch (error) {
    console.error('Error creating Stripe Checkout Session:', error)
    return NextResponse.json({ error: 'Error creating Stripe Checkout Session' }, { status: 500 })
  }
}
