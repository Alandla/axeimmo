import { SimpleSpace } from "../types/space";
import { basicApiCall, basicApiGetCall } from "../lib/api";
import { UserOnboardingData } from "../store/onboardingStore";
import { IUser } from "../types/user";

export async function fetchSpaceMembers(spaces: SimpleSpace[]): Promise<SimpleSpace[]> {
    // Collecter tous les IDs d'utilisateurs uniques depuis tous les espaces
    const allUserIds = new Set<string>()
    
    spaces.forEach(space => {
      if (space.members) {
        space.members.forEach(member => {
          allUserIds.add(member.id)
        })
      }
    })

    // Convertir en array et filtrer les IDs vides
    const uniqueUserIds = Array.from(allUserIds).filter(id => id && id.trim() !== '')
    
    if (uniqueUserIds.length === 0) {
      return spaces
    }

    try {
      // Récupérer les données de tous les utilisateurs en parallèle
      const userPromises = uniqueUserIds.map(async (userId) => {
        try {
          const user: IUser = await basicApiCall('/user/getByIdForVideo', { userId })
          return { id: userId, user }
        } catch (error) {
          console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error)
          return { id: userId, user: null }
        }
      })
      
      const userResults = await Promise.allSettled(userPromises)
      
      // Créer un cache des utilisateurs
      const usersCache = new Map<string, IUser>()
      userResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.user) {
          usersCache.set(result.value.id, result.value.user)
        }
      })
      
      // Mettre à jour chaque espace avec les informations complètes de ses membres
      const updatedSpaces = spaces.map(space => {
        if (space.members) {
          const completedMembers = space.members.map(member => {
            const user = usersCache.get(member.id)
            return user ? {
              id: user.id,
              name: user.name || '',
              image: user.image || ''
            } : {
              id: member.id,
              name: '',
              image: ''
            }
          }).filter(member => member.name) // Filtrer les membres sans nom (échec de récupération)
          
          return {
            ...space,
            members: completedMembers
          }
        }
        return space
      })
      
      console.log("spacesWithMembers", updatedSpaces)
      
      return updatedSpaces
      
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error)
      return spaces
    }
}

export async function getSpaces(): Promise<SimpleSpace[]> {
    try {
        const response = await basicApiGetCall<SimpleSpace[]>('/user/getSpaces');
        console.log("response", response);
        return response;
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