import axios from "axios";
import { SHA256 } from "crypto-js";

export const trackSignUpFacebook = async (mail: string, userId: string, fbc?: string, fbp?: string) => {
  const hashedEmail = SHA256(mail).toString();
  const hashedUserId = SHA256(userId).toString();

  const API_VERSION = "v22.0";
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const TOKEN = process.env.FACEBOOK_TOKEN_ACCESS;

  const eventTime = Math.floor(Date.now() / 1000);

  const eventData = {
    "data": [
        {
            "event_name": "Lead",
            "event_time": eventTime,
            "action_source": "website",
            "user_data": {
                "em": [hashedEmail],
                "external_id": [hashedUserId],
                ...(fbc ? { "fbc": fbc } : {}),
                ...(fbp ? { "fbp": fbp } : {})
            }
        }
    ],
  };

  try {
    const response = await axios.post(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`, eventData);
  } catch (error) {
    console.error("Error when sending SignUp event to Facebook :", error);
  }
}

export const trackAddToCartFacebook = async (mail: string, userId: string, price: number, currency: string = "EUR", fbc?: string, fbp?: string) => {
  const hashedEmail = SHA256(mail).toString();
  const hashedUserId = SHA256(userId).toString();

  const API_VERSION = "v22.0";
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const TOKEN = process.env.FACEBOOK_TOKEN_ACCESS;

  const eventTime = Math.floor(Date.now() / 1000);

  const userData: any = {
    "em": [hashedEmail],
    "external_id": [hashedUserId]
  };

  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;

  const eventData = {
    "data": [
        {
            "event_name": "AddToCart",
            "event_time": eventTime,
            "action_source": "website",
            "user_data": userData,
            "custom_data": {
                "currency": currency,
                "value": price.toString()
            }
        }
    ],
    "test_event_code": "TEST88235"
  };

  try {
    const response = await axios.post(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`, eventData);
  } catch (error) {
    console.error("Error when sending AddToCart event to Facebook :", error);
  }
}

export const trackOrderFacebook = async (mail: string, invoiceId: string, subscriptionId: string, userId: string, price: number, currency: string = "EUR", fbc?: string, fbp?: string) => {
  const hashedEmail = SHA256(mail).toString();
  const hashedUserId = SHA256(userId).toString();

  const API_VERSION = "v22.0";
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const TOKEN = process.env.FACEBOOK_TOKEN_ACCESS;

  const eventTime = Math.floor(Date.now() / 1000);

  const userData: any = {
    "em": [hashedEmail],
    "external_id": [hashedUserId]
  };

  if (subscriptionId) userData.subscription_id = subscriptionId;
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;

  const eventData = {
    "data": [
        {
            "event_name": "Purchase",
            "event_time": eventTime,
            "event_id": invoiceId,
            "action_source": "website",
            "user_data": userData,
            "custom_data": {
                "currency": currency,
                "value": price.toString()
            }
        }
    ],
    "test_event_code": "TEST88235"
  };

  try {
    const response = await axios.post(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`, eventData);
  } catch (error) {
    console.error("Error when sending Purchase event to Facebook :", error);
  }
}