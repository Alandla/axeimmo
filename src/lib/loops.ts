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
  console.log(contact)
  const result = await loops.updateContact(contact[0].email, {
    videosCount: contact[0]?.videosCount ? Number(contact[0].videosCount) + 1 : 1
  });
  console.log(result)
  return result;
}

export const checkHasBetaAccess = async (email: string) => {
  const result = await loops.findContact({ email });
  return !!result[0].betaAccess; //Convert to primitive boolean
}

export async function sendVerificationRequest({ identifier: email, url }: { identifier: string, url: string }) {
  const dataVariables = {
    link: url
  }

  const result = await loops.sendTransactionalEmail({
    transactionalId: mails.magicLink.id,
    email,
    dataVariables
  })

  return result;
}