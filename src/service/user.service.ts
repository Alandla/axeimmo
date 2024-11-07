import { SimpleSpace } from "../types/space";
import { basicApiGetCall } from "../lib/api";

export async function getSpaces(): Promise<SimpleSpace[]> {
    try {
        const response = await basicApiGetCall<SimpleSpace[]>('/user/getSpaces');
        return response
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return [];
    }
}
