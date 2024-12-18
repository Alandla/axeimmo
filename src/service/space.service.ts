import { ISpace, SimpleSpace } from "../types/space";
import { basicApiGetCall } from "../lib/api";

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
