import { google } from 'googleapis';

const customsearch = google.customsearch('v1');

export const getImagesGoogle = async (search: string, nb: number, page: number) => {
    const videoResult = customsearch.cse.list({
        auth: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CX,
        imgSize: 'huge',
        imgType: 'photo',
        q: search,
        num: nb,
        start: page*nb,
        searchType: 'image'
    });

    return videoResult;
}

export const getGoogleImagesMedia = async (keyword: string, number: number, page: number) => {
    const images = await getImagesGoogle(keyword, number, page)
    const validImages = await getValidImagesFromGoogle(images)
    return googleImageToMedia(validImages);
}

const getValidImagesFromGoogle = async (result: any) => {
  const validImages = await Promise.all(
    result.data.items.map(async (item: any) => {
      const isValid = await isImageValid(item.link);
      return isValid ? item : null;
    })
  );

  return validImages.filter((item) => item !== null);
}

const isImageValid = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    return false;
  }
}

function googleImageToMedia(images: any[]) {
  return images.map(image => {
    const uniqueId = `img-${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      type: "image",
      name: image.title,
      height: image.image.height,
      width: image.image.width,
      image: {
        id: uniqueId, // Utiliser le lien comme identifiant unique si nécessaire
        link: image.link,
        height: image.image.height,
        width: image.image.width,
      },
    };
  });
}