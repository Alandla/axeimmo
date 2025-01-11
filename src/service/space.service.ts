import { ISpace, SimpleSpace } from "../types/space";
import { basicApiGetCall } from "../lib/api";
import { Voice } from "../types/voice";
import { Avatar } from "../types/avatar";

export async function getSpaceById(id: string): Promise<SimpleSpace | null> {
    try {
        const response = await basicApiGetCall<ISpace>('/space/' + id);
        const space : SimpleSpace = {
            id: response.id,
            name: response.name,
            planName: response.plan.name,
            creditsPerMonth: response.plan.creditsMonth,
            credits: response.credits,
        }
        return space
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return null;
    }
}

export async function getSpaceVoices(id: string): Promise<Voice[]> {
    try {
        const response = await basicApiGetCall<Voice[]>(`/space/${id}/voices`)
        return response
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return [];
    }
}

export async function getSpaceAvatars(id: string): Promise<Avatar[]> {
    try {
        const response = await basicApiGetCall<Avatar[]>(`/space/${id}/avatars`)
        return response
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return [];
    }
}