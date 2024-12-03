import { mailBetaList } from "../config/beta.config";

export default async function checkBetaAccess(email: string) {
  if (mailBetaList.includes(email)) {
    return true;
  } else {
    return false;
  }
}