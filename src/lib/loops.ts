import { LoopsClient } from 'loops';
import { mails } from '../config/mails.config';

const loops = new LoopsClient(process.env.LOOPS_API_KEY as string);

export const createContact = async (mail: string, properties: any) => {
  console.log(mail, properties)
  const result = await loops.createContact(mail, properties);
  return result;
}

export const addUserIdToContact = async (userId: string, email: string) => {
  const result = await loops.updateContact(email, {
    userId: userId
  });
  console.log(result);
  return result;
}

export const addVideoCountContact = async (userId: string) => {
  const contact = await loops.findContact({ userId });
  if (contact.length === 0) {
    return;
  }
  const result = await loops.updateContact(contact[0].email, {
    videosCount: contact[0]?.videosCount ? Number(contact[0].videosCount) + 1 : 1
  });
  return contact[0];
}

export const addVideoExportedContact = async (userId: string) => {
  const contact = await loops.findContact({ userId });
  if (contact.length === 0) {
    return;
  }
  const result = await loops.updateContact(contact[0].email, {
    videosExported: contact[0]?.videosExported ? Number(contact[0].videosExported) + 1 : 1
  });
  return result;
}

export const checkHasBetaAccess = async (email: string) => {
  const result = await loops.findContact({ email });
  return !!result[0].betaAccess; //Convert to primitive boolean
}

export async function sendExportedVideoEmail({ email, userName, videoName, exportId, thumbnailUrl }: { email: string, userName: string, videoName: string, exportId: string, thumbnailUrl: string }) {
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
}

export async function sendCreatedVideoEvent({ email, videoId }: { email: string, videoId: string }) {
  const result = await loops.sendEvent({
    eventName: "Video create",
    email,
    eventProperties: {
      videoId
    }
  })
  return result;
}

export async function sendVerificationRequest({ identifier: email, url, deviceId }: { identifier: string, url: string, deviceId?: string }) {
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
}