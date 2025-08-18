import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { getSpaceById } from '@/src/dao/spaceDao';
import { createApiKey, getApiKeysBySpaceId, getApiKeyById, regenerateApiKey, revokeApiKey } from '@/src/dao/apiKeyDao';
import { PlanName } from '@/src/types/enums';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/space/[id]/api-key by user: ", session.user.id);

  try {
    const isAdmin = session.user.email === "alan@hoox.video" || session.user.email === "maxime@hoox.video";
    
    if (!isAdmin) {
      const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);
      if (!userIsInSpace) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const space = await getSpaceById(params.id);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Vérifier que le space a un plan Entreprise
    if (space.plan?.name !== PlanName.ENTREPRISE) {
      return NextResponse.json({ 
        error: "Enterprise plan required",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const apiKeys = await getApiKeysBySpaceId(params.id);

    return NextResponse.json({ 
      data: apiKeys.map(apiKey => ({
        id: apiKey._id,
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        lastUsedAt: apiKey.lastUsedAt,
        permissions: apiKey.permissions,
        rateLimitPerMinute: apiKey.rateLimitPerMinute,
        createdAt: apiKey.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json({ error: 'Error getting API key' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/[id]/api-key by user: ", session.user.id);

  try {
    const isAdmin = session.user.email === "alan@hoox.video" || session.user.email === "maxime@hoox.video";
    
    if (!isAdmin) {
      const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);
      if (!userIsInSpace) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const space = await getSpaceById(params.id);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Vérifier que le space a un plan Entreprise
    if (space.plan?.name !== PlanName.ENTREPRISE) {
      return NextResponse.json({ 
        error: "Enterprise plan required",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const { action, name, keyId } = await req.json();

    if (action === 'create') {
      const { apiKey, plainKey } = await createApiKey(params.id, name);
      
      return NextResponse.json({ 
        data: {
          apiKey: {
            id: apiKey._id,
            keyPrefix: apiKey.keyPrefix,
            name: apiKey.name,
            permissions: apiKey.permissions,
            rateLimitPerMinute: apiKey.rateLimitPerMinute,
            createdAt: apiKey.createdAt
          },
          plainKey // Retourné une seule fois !
        }
      });
    } else if (action === 'regenerate') {
      if (!keyId) {
        return NextResponse.json({ error: "Key ID required for regeneration" }, { status: 400 });
      }
      
      const { apiKey, plainKey } = await regenerateApiKey(params.id, keyId);
      
      return NextResponse.json({ 
        data: {
          apiKey: {
            id: apiKey._id,
            keyPrefix: apiKey.keyPrefix,
            name: apiKey.name,
            permissions: apiKey.permissions,
            rateLimitPerMinute: apiKey.rateLimitPerMinute,
            createdAt: apiKey.createdAt
          },
          plainKey // Retourné une seule fois !
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error managing API key:', error);
    
    if (error.message === 'API key already exists for this space') {
      return NextResponse.json({ error: 'API key already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Error managing API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("DELETE /api/space/[id]/api-key by user: ", session.user.id);

  try {
    const isAdmin = session.user.email === "alan@hoox.video" || session.user.email === "maxime@hoox.video";
    
    if (!isAdmin) {
      const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);
      if (!userIsInSpace) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('keyId');
    
    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    const success = await revokeApiKey(params.id, keyId);

    if (!success) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Error revoking API key' }, { status: 500 });
  }
}