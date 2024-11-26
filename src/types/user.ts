export interface IUser {
  id: string;
  name: string;
  email: string;
  image: string;
  options: {
    lang: string;
  };
  spaces: string[];
}