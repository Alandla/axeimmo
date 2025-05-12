import { getImageDimensions } from "../service/upload.service";
import { basicApiCall } from "./api";

/**
 * Extrait toutes les URL d'un texte
 * @param text - Le texte à analyser
 * @returns Un tableau d'URLs trouvées
 */
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : []; // Utilisation de Set pour éliminer les doublons
};

export const getArticleContentFromUrl = async (url: string) => {

    try {
      const data : any = await basicApiCall('/article/getContent', { url })
      console.log(data)
      console.log(data.content)
      const cleanedContent = await cleanArticleContent(data);
      console.log(data.content)
      console.log(cleanedContent)
      return { text: cleanedContent.text, images: cleanedContent.images, title: data.content.title }
    } catch (error) {
      throw error;
    }
  };

export const cleanArticleContent = async (content: any) => {
    // Vérifier si content.content est une chaîne ou un objet
    const htmlContent = typeof content.content === 'string' 
        ? content.content 
        : JSON.stringify(content.content);

    // Créer un élément DOM temporaire
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extraire le texte sans les balises HTML
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Ajout d'une vérification et d'un nettoyage du JSON
    let contentJson;
    try {
        contentJson = JSON.parse(textContent.trim());
    } catch (error) {
        const cleanedContent = textContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    try {
        contentJson = JSON.parse(cleanedContent.trim());
    } catch (error) {
        contentJson = { content: textContent }; // Fallback si le JSON est invalide
    }
}
  
    // Fonction pour décoder les entités HTML
const decodeHTMLEntities = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

// Extraire les images
const imagesPromises = await Promise.all(Array.from(tempDiv.querySelectorAll('img')).map(async (img) => {
    // Récupérer l'attribut alt complet
    let alt : any = img.outerHTML.match(/alt=(".*?"|'.*?')/);
    alt = alt ? alt[1].slice(1, -1) : '';
    alt = decodeHTMLEntities(alt);

    let url = decodeHTMLEntities(img.getAttribute('src') || '');
    // Nettoyer l'URL de l'image
    url = url.replace(/^http:\/\/localhost:3000\/["']?/, '');
    url = url.replace(/^%22/, ''); // Enlever "%22 au début
    url = url.replace(/%22$/, ''); // Enlever "%22 à la fin
    url = url.replace(/["']$/, '');
    url = url.replace(/\\"/g, ''); // Enlever les guillemets échappés
    url = url.replace(/\\$/, ''); // Enlever le caractère '\' à la fin de l'URL

    const dimensions = await getImageDimensions(url);

    if (dimensions?.height && dimensions?.width && dimensions?.height > 150) {
        return {
            type: "image",
            name: alt,
            height: dimensions.height,
            width: dimensions.width,
            image: {
            id: crypto.randomUUID(),
            link: url,
            height: dimensions.height,
            width: dimensions.width,
            },
        };
    } else {
    return null;
    }
}));

const images = imagesPromises.filter(image => image !== null);

return {
    text: contentJson.content,
    images: images
};
};
