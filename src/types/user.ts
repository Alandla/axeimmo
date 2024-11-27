export interface IUser {
  id: string;
  name: string;
  email: string;
  image: string;
  locale: string;
  options: {
    lang: string;
  };
  spaces: string[];
}