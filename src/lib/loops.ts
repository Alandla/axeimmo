import { LoopsClient } from 'loops';
import { mails } from '../config/mails.config';
import { logger } from '@trigger.dev/sdk/v3';

const loops = new LoopsClient(process.env.LOOPS_API_KEY as string);

export const createContact = async (mail: string, properties: any) => {
  try {
    console.log(mail, properties)
    const result = await loops.createContact(mail, properties);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error creating contact', { error: errorMessage, mail });
    return null;
  }
}

export const addUserIdToContact = async (userId: string, email: string) => {
  try {
    const result = await loops.updateContact(email, {
      userId: userId
    });
    console.log(result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error adding userId to contact', { error: errorMessage, userId, email });
    return null;
  }
}

export const addVideoCountContact = async (userId: string) => {
  try {
    const contact = await loops.findContact({ userId });
    if (contact.length === 0) {
      return null;
    }
    logger.log('[VIDEO COUNT] Contact', { email: contact[0].email });
    const result = await loops.updateContact(contact[0].email, {
      videosCount: contact[0]?.videosCount ? Number(contact[0].videosCount) + 1 : 1
    });
    return contact[0];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error adding video count to contact', { error: errorMessage, userId });
    return null;
  }
}

export const addVideoExportedContact = async (userId: string) => {
  try {
    const contact = await loops.findContact({ userId });
    if (contact.length === 0) {
      return null;
    }
    const result = await loops.updateContact(contact[0].email, {
      videosExported: contact[0]?.videosExported ? Number(contact[0].videosExported) + 1 : 1
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error adding video exported to contact', { error: errorMessage, userId });
    return null;
  }
}

export async function sendExportedVideoEmail({ email, userName, videoName, exportId, thumbnailUrl }: { email: string, userName: string, videoName: string, exportId: string, thumbnailUrl: string }) {
  try {
    const result = await loops.sendTransactionalEmail({
      transactionalId: mails.videoExported.id,
      email,
      dataVariables: {
        userName,
        videoName,
        exportId,
        thumbnailUrl
      }
    })
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error sending exported video email', { error: errorMessage, email, videoName });
    return null;
  }
}

export async function sendCreatedVideoEvent({ email, videoId }: { email: string, videoId: string }) {
  try {
    const result = await loops.sendEvent({
      eventName: "Video create",
      email,
      eventProperties: {
        videoId
      }
    })
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error sending created video event', { error: errorMessage, email, videoId });
    return null;
  }
}

export async function sendVerificationRequest({ identifier: email, url, deviceId }: { identifier: string, url: string, deviceId?: string }) {
  try {
    const finalURL = url + `&deviceId=${deviceId}`;
    
    const dataVariables = {
      link: finalURL
    }

    const result = await loops.sendTransactionalEmail({
      transactionalId: mails.magicLink.id,
      email,
      dataVariables
    })

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error sending verification request', { error: errorMessage, email });
    return null;
  }
}

export async function sendProLeadEmail({ 
  name, 
  firstName, 
  email, 
  role, 
  website, 
  companyName 
}: { 
  name: string, 
  firstName: string, 
  email: string, 
  role: string, 
  website: string, 
  companyName: string 
}) {
  try {
    const result = await loops.sendTransactionalEmail({
      transactionalId: mails.proLead.id,
      email: 'maxime@hoox.video',
      dataVariables: {
        name,
        firstname: firstName,
        mail: email,
        role,
        site: website,
        'company-name': companyName
      }
    })
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error sending pro lead email', { error: errorMessage, email, companyName });
    return null;
  }
}

export async function updateCancelReason(email: string, cancelReason: string) {
  try {
    const result = await loops.updateContact(email, {
      cancelReason: cancelReason
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error updating cancel reason', { error: errorMessage, email, cancelReason });
    return null;
  }
}

export async function sendUnsubscribeEvent(email: string) {
  try {
    const result = await loops.sendEvent({
      eventName: "Unsubscribe",
      email
    });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[LOOPS] Error sending unsubscribe event', { error: errorMessage, email });
    return null;
  }
}