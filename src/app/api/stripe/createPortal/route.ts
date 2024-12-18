import { getSpaceById } from "@/src/dao/spaceDao";
import { isUserInSpace } from "@/src/dao/userDao";
import { auth } from "@/src/lib/auth";
import { createCustomerPortal } from "@/src/lib/stripe";
import { ISpace } from "@/src/types/space";
import { NextResponse } from "next/server";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// By default, it doesn't force users to be authenticated. But if they are, it will prefill the Checkout data with their email and/or credit card
export async function POST(req: Request) {

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/stripe/createPortal by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, returnUrl } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space : ISpace = await getSpaceById(spaceId);

    const stripePortalURL = await createCustomerPortal({
      customerId: space.plan.customerId,
      returnUrl: returnUrl,
    });

    console.log("Portal Stripe URL:", stripePortalURL);

    if (!stripePortalURL) {
      console.error("Stripe Portal URL is undefined");
      return NextResponse.json({ error: 'Stripe Portal URL is undefined' }, { status: 500 });
    }

    return NextResponse.json({ data: stripePortalURL });
  } catch (error) {
    console.error('Error creating Stripe Portal URL:', error)
    return NextResponse.json({ error: 'Error creating Stripe Portal URL' }, { status: 500 })
  }
}
