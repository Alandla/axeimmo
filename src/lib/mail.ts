import disposableDomains from './disposable-emails/disposableEmail.json';

export default async function isDisposableEmail(email: string) {
  // Extraire le domaine de l'adresse e-mail
  const domain = email.split('@')[1];

  // Vérifier si le domaine est présent dans la liste des domaines jetables
  if (disposableDomains.includes(domain)) {
    return true; // Le domaine est jetable
  } else {
    return false; // Le domaine n'est pas jetable
  }
}