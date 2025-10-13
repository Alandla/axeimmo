import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { findCheckoutSession } from "@/src/lib/stripe";
import { createUser, getUserByEmail, getUserById } from "@/src/dao/userDao";
import { addUserIdToContact, updateCancelReason, sendUnsubscribeEvent, updateCustomerStatus } from "@/src/lib/loops";
import { createPrivateSpaceForUser, getSpaceById, removeCreditsToSpace, setCreditsToSpace, updateSpacePlan, setupNewSubscription } from "@/src/dao/spaceDao";
import { plans, storageLimit, avatarsLimit } from "@/src/config/plan.config";
import { IPlan, ISpace } from "@/src/types/space";
import { SubscriptionType } from "@/src/types/enums";
import { track } from "@/src/utils/mixpanel-server";
import { MixpanelEvent } from "@/src/types/events";
import { trackOrderFacebook } from "@/src/lib/facebook";
import connectMongo from "@/src/lib/mongoose";
import { objectIdToString } from "@/src/lib/utils";

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

        await connectMongo();

        const checkoutId = event.data.object.id;

        const session = await findCheckoutSession(checkoutId);

        const customerId = session?.customer;

        const priceId = session?.line_items?.data[0]?.price?.id;
        const userId = event.data.object.client_reference_id;
        let spaceId = session?.metadata?.spaceId;
        const fbc = session?.metadata?.fbc;
        const fbp = session?.metadata?.fbp;

        const customerEmail = event.data.object.customer_details?.email;
        const customerName = event.data.object.customer_details?.name;
        const priceAmount = session?.amount_total ? session.amount_total / 100 : 0;

        const priceData = await stripe.prices.retrieve(priceId as string);
        const productData = await stripe.products.retrieve(priceData.product as string);

        const billingInterval = priceData.recurring?.interval;

        let user;

        // Get or create the user. userId is normally pass in the checkout session (clientReferenceID) to identify the user when we get the webhook event
        if (userId) {
          user = await getUserById(userId);
          if (!spaceId && user.spaces && user.spaces.length !== 0) {
            spaceId = user.spaces[0];
          }
        } else if (customerEmail) {
          user = await getUserByEmail(customerEmail);
          if (user && !spaceId && user.spaces && user.spaces.length !== 0) {
            spaceId = user.spaces[0];
          }
          if (!user) {
            const u = {
              email: customerEmail,
              name: customerName,
            }
            user = await createUser(u);
            await addUserIdToContact(user.id, user.email);
            const newSpace = await createPrivateSpaceForUser(user.id, user.firstName || user.name);
            spaceId = objectIdToString(newSpace._id);
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

        // Si le nom du plan est "createur", on utilise "start" à la place
        const planName = productData.metadata.name === "createur" ? "START" : productData.metadata.name;
        const plan = plans.find(p => p.name === planName);
        if (!plan) {
          throw new Error(`Plan ${planName} not found`);
        }

        const planSpace : IPlan = {
          name: plan.name,
          customerId: customerId as string,
          priceId: priceId as string,
          subscriptionType: billingInterval === "month" ? SubscriptionType.MONTHLY : SubscriptionType.ANNUAL,
          creditsMonth: plan.credits,
          storageLimit: storageLimit[plan.name],
          imageToVideoLimit: plan.imageToVideoLimit,
          nextPhase: nextPhase,
          avatarsLimit: plan.avatarsLimit,
        }

        // Configuration complète du nouvel abonnement en une seule opération
        await setupNewSubscription(spaceId as string, planSpace, plan.credits);
        
        if (fbc || fbp) {
          trackOrderFacebook(user?.email, session?.invoice as string, session?.subscription as string, user?.id?.toString(), priceAmount, priceData.currency.toUpperCase(), fbc, fbp);
        }

        // Update Loops: set customer as active
        if (user?.email) {
          try {
            await updateCustomerStatus(user.email, true, true);
            console.log(`[LOOPS] Updated customer status for ${user.email}: client=true, hasBeenCustomer=true`);
          } catch (error) {
            console.error(`[LOOPS] Failed to update customer status for ${user.email}:`, error);
          }
        }

        // Track subscription in Mixpanel
        if (user.id) {
          track(MixpanelEvent.SUBSCRIPTION_CREATED, {
            distinct_id: user.id,
            plan: plan.name,
            subscriptionType: billingInterval === "month" ? "monthly" : "annual",
            price: priceAmount,
            currency: priceData.currency,
          });
        }

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

        await connectMongo();

        const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
        
        const product = event.data.object.items.data[0].price.product;
        const spaceId = subscription.metadata.spaceId;
        const customerId = event.data.object.customer;
        const priceId = event.data.object.items.data[0].price.id;
        const billingInterval = event.data.object.items.data[0].price.recurring?.interval;

        if (event.data.object.cancel_at_period_end === true) {

          const customer = await stripe.customers.retrieve(customerId as string);

          const cancelReason = event.data.object.cancellation_details?.feedback || "unknown";

          if (customer && !customer.deleted && customer.email) {
            if (cancelReason) {
              await updateCancelReason(customer.email, cancelReason);
            }
            await sendUnsubscribeEvent(customer.email);
          }
        } else {
          // Logique existante pour les autres mises à jour d'abonnement
          const productData = await stripe.products.retrieve(product as string);

          let nextPhase;

          if (billingInterval !== "month") {
            nextPhase = new Date(); // Créez un nouvel objet Date
            nextPhase.setHours(0, 0, 0, 0);
            nextPhase.setMonth(nextPhase.getMonth() + 1);
          }

          const planName = productData.metadata.name === "CREATOR" ? "START" : productData.metadata.name;
          const plan = plans.find(p => p.name === planName);
          if (!plan) {
            throw new Error(`Plan ${planName} not found`);
          }

          const planSpace : IPlan = {
            name: plan.name,
            customerId: customerId as string,
            priceId: priceId as string,
            subscriptionType: billingInterval === "month" ? SubscriptionType.MONTHLY : SubscriptionType.ANNUAL,
            creditsMonth: plan.credits,
            storageLimit: storageLimit[plan.name],
            imageToVideoLimit: plan.imageToVideoLimit,
            nextPhase: nextPhase,
            avatarsLimit: avatarsLimit[plan.name],
          }

          await updateSpacePlan(spaceId, planSpace);
        }

        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        console.log("STRIPE EVENT: customer.subscription.deleted")
        
        await connectMongo();
        
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
          storageLimit: storageLimit[SubscriptionType.FREE], // Limite de stockage du plan gratuit
        });

        // Update Loops: set customer as inactive
        const customerId = event.data.object.customer;
        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(customerId as string);
            if (customer && !customer.deleted && customer.email) {
              await updateCustomerStatus(customer.email, false, true);
              console.log(`[LOOPS] Updated customer status for ${customer.email}: client=false, hasBeenCustomer=true`);
            }
          } catch (error) {
            console.error(`[LOOPS] Failed to update customer status:`, error);
          }
        }

        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        console.log("STRIPE EVENT: checkout.invoice.paid")

        const subscriptionId = event.data.object.subscription;
        
        if (!subscriptionId) {
          console.error("No subscription found in invoice");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const spaceId = subscription.metadata.spaceId;

        if (!spaceId) {
          console.error("Space not found");
          break;
        }

        const space : ISpace = await getSpaceById(spaceId);

        // Renouvellement mensuel avec logique des 30% de bonus sur crédits restants
        const creditsMonth = space.plan.creditsMonth;
        const currentCredits = space.credits;
        const maxPossibleCredits = creditsMonth + Math.floor(creditsMonth * 0.3 * 3); // 3 mois de bonus max
        
        let finalCredit;
        
        if (currentCredits >= maxPossibleCredits || currentCredits === creditsMonth) {
          // L'utilisateur a déjà le maximum possible (3 mois de bonus), on remet aux crédits de base
          finalCredit = creditsMonth;
        } else {
          // On calcule le bonus : 30% des crédits restants
          const bonusCredits = Math.floor(currentCredits * 0.3);
          const newTotal = creditsMonth + bonusCredits;
          
          // On vérifie qu'on ne dépasse pas le maximum autorisé
          finalCredit = Math.min(newTotal, maxPossibleCredits);
        }

        // Attribution des crédits et remise à zéro du compteur imageToVideoUsed en une seule opération
        await setCreditsToSpace(spaceId, finalCredit, true);

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

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing Stripe webhook: ${err.message}`);
    return NextResponse.json(
      { error: `Error processing Stripe webhook: ${err.message}` },
      { status: 400 }
    );
  }
}
