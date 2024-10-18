import { LoopsClient } from 'loops';

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


export const sendVerificationRequest = async ({ identifier: email, url }: { identifier: string, url: string }) => {
  const dataVariables = {
    url: url
  }

  const result = await loops.sendTransactionalEmail({
    transactionalId: "clx9nzuzs03c5i0yuujszbzew",
    email,
    dataVariables
  })

  return result;
}