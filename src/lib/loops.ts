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