import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { findCheckoutSession } from "@/src/lib/stripe";
import { createUser, getUserByEmail, getUserById } from "@/src/dao/userDao";
import { addUserIdToContact } from "@/src/lib/loops";
import { createPrivateSpaceForUser, getSpaceById, removeCreditsToSpace, setCreditsToSpace, updateSpacePlan } from "@/src/dao/spaceDao";
import { plans } from "@/src/config/plan.config";
import { IPlan, ISpace } from "@/src/types/space";
import { SubscriptionType } from "@/src/types/enums";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: Request) {

  const body = await req.text();

  const signature = headers().get("stripe-signature") as string;

  let event;

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    console.log("Event stripe:", event.type)
    switch (event.type) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        console.log("STRIPE EVENT: checkout.session.completed")

        const checkoutId = event.data.object.id;

        const session = await findCheckoutSession(checkoutId);

        const customerId = session?.customer;

        const priceId = session?.line_items?.data[0]?.price?.id;
        const userId = event.data.object.client_reference_id;
        const spaceId = session?.metadata?.spaceId;

        const customerEmail = event.data.object.customer_details?.email;
        const customerName = event.data.object.customer_details?.name;

        const priceData = await stripe.prices.retrieve(priceId as string);
        const productData = await stripe.products.retrieve(priceData.product as string);

        const billingInterval = priceData.recurring?.interval;

        let user;

        // Get or create the user. userId is normally pass in the checkout session (clientReferenceID) to identify the user when we get the webhook event
        if (userId) {
          user = await getUserById(userId);
        } else if (customerEmail) {
          user = await getUserByEmail(customerEmail);

          if (!user) {
            const u = {
              email: customerEmail,
              name: customerName,
            }
            user = await createUser(u);
            await addUserIdToContact(user.id, user.email);
            await createPrivateSpaceForUser(user.id, user.name);
          }
        } else {
          console.error("No user found");
          throw new Error("No user found");
        }

        let nextPhase;

        if (billingInterval !== "month") {
          let today = new Date();
          today.setHours(0, 0, 0, 0);
          today.setMonth(today.getMonth() + 1);
          nextPhase = today;
        }

        const plan = plans.find(p => p.name === productData.metadata.name);
        if (!plan) {
          throw new Error(`Plan ${productData.metadata.name} not found`);
        }

        const planSpace : IPlan = {
          name: plan.name,
          customerId: customerId as string,
          priceId: priceId as string,
          subscriptionType: billingInterval === "month" ? SubscriptionType.MONTHLY : SubscriptionType.ANNUAL,
          creditsMonth: plan.credits,
          nextPhase: nextPhase
        }

        await updateSpacePlan(spaceId as string, planSpace);

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail({to: ...});
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        console.log("STRIPE EVENT: customer.subscription.updated")

        const product = event.data.object.items.data[0].price.product;
        const spaceId = event.data.object.metadata.spaceId;
        const customerId = event.data.object.customer;
        const priceId = event.data.object.items.data[0].price.id;
        const billingInterval = event.data.object.items.data[0].price.recurring?.interval;

        const productData = await stripe.products.retrieve(product as string);

        let nextPhase;

        if (billingInterval !== "month") {
          nextPhase = new Date(); // Créez un nouvel objet Date
          nextPhase.setHours(0, 0, 0, 0);
          nextPhase.setMonth(nextPhase.getMonth() + 1);
        }

        const plan = plans.find(p => p.name === productData.metadata.name);
        if (!plan) {
          throw new Error(`Plan ${productData.metadata.name} not found`);
        }

        const planSpace : IPlan = {
          name: plan.name,
          customerId: customerId as string,
          priceId: priceId as string,
          subscriptionType: billingInterval === "month" ? SubscriptionType.MONTHLY : SubscriptionType.ANNUAL,
          creditsMonth: plan.credits,
          nextPhase: nextPhase
        }

        await updateSpacePlan(spaceId, planSpace);

        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
        const spaceId = subscription.metadata.spaceId;

        const space : ISpace = await getSpaceById(spaceId);

        if (!space) {
          console.error("Space not found");
          break;
        }

        const creditToRemove = space.credits * 0.7;

        await removeCreditsToSpace(spaceId, creditToRemove);
        
        await updateSpacePlan(spaceId, {
          priceId: "",
          subscriptionType: SubscriptionType.FREE,
          creditsMonth: 0,
        });

        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        console.log("STRIPE EVENT: checkout.invoice.paid")

        const spaceId = event.data.object.subscription_details?.metadata?.spaceId;

        if (!spaceId) {
          console.error("Space not found");
          break;
        }

        const space : ISpace = await getSpaceById(spaceId);

        const creditToAdd = space.credits * 0.3;
        let finalCredit;
        if (creditToAdd >= (space.plan.creditsMonth*0.3)*3) {
          finalCredit = space.plan.creditsMonth;
        } else {
          finalCredit = space.plan.creditsMonth + creditToAdd;
        }

        await setCreditsToSpace(spaceId, finalCredit);

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e: any) {
    console.error("stripe error: " + e.message + " | EVENT TYPE: " + event.type);
  }

  return NextResponse.json({});
}
