import { SimpleSpace } from "../types/space";
import { basicApiCall, basicApiGetCall } from "../lib/api";
import { UserOnboardingData } from "../store/onboardingStore";
import { IUser } from "../types/user";

export async function getSpaces(): Promise<SimpleSpace[]> {
    try {
        const response = await basicApiGetCall<SimpleSpace[]>('/user/getSpaces');
        console.log("response", response);
        return response
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return [];
    }
}

export async function updateOnboarding(onboardingUser: UserOnboardingData, isComplete: boolean = false): Promise<any> {
    try {
        let updateData: Partial<IUser> = {};
        updateData.name = onboardingUser.name;
        updateData.firstName = onboardingUser.firstName;
        updateData.role = onboardingUser.role;
        updateData.discoveryChannel = onboardingUser.discoveryChannel;
        updateData.goal = onboardingUser.goal;
        updateData.hasFinishedOnboarding = isComplete;

        const response = await basicApiCall('/user/update', { updateData })
        return response;
    } catch (error) {
        console.error("Error updating space details:", error);
        throw error;
    }
} 