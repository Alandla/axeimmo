export interface IUser {
  id: string;
  name: string;
  email: string;
  image: string;
  customerId: string;
  options: {
    lang: string;
  };
  spaces: string[];
  checkAffiliate?: boolean;
}