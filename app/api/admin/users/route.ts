import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/services/adminAuth';
import { dbService } from '@/services/dbService';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(req);
    if (authResult.authorized === false) {
      return authResult.response;
    }

    const allUsers = await dbService.getAllUsers();
    // Strip sensitive fields like privateKeyHash
    const safeUsers = allUsers.map((u) => ({
      publicKey: u.publicKey,
      username: u.username,
      tier: u.tier,
      access: u.access,
      shippingName: u.shippingName,
      shippingAddress: u.shippingAddress,
      shippingCity: u.shippingCity,
      shippingZip: u.shippingZip,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      hasPrivateKeyRegistered: !!u.privateKeyHash,
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers,
      total: safeUsers.length,
    });
  } catch (error: any) {
    console.error('Admin users GET route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(req);
    if (authResult.authorized === false) {
      return authResult.response;
    }

    const body = await req.json();
    const { targetPublicKey, tier, username, access, shippingName, shippingAddress, shippingCity, shippingZip } = body;

    if (!targetPublicKey) {
      return NextResponse.json({ error: 'Missing targetPublicKey in request body.' }, { status: 400 });
    }

    // Validate tier if provided
    const validTiers = ['admin', 'unlimited', 'pro', 'free'];
    if (tier && !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier "${tier}". Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      );
    }

    // Ensure target exists
    const targetUser = await dbService.getUser(targetPublicKey);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user does not exist in registry.' }, { status: 404 });
    }

    // Perform updates
    await dbService.updateUser(targetPublicKey, {
      ...(tier ? { tier } : {}),
      ...(username ? { username } : {}),
      ...(access ? { access } : {}),
      ...(shippingName !== undefined ? { shippingName } : {}),
      ...(shippingAddress !== undefined ? { shippingAddress } : {}),
      ...(shippingCity !== undefined ? { shippingCity } : {}),
      ...(shippingZip !== undefined ? { shippingZip } : {}),
    });

    const updatedUser = await dbService.getUser(targetPublicKey);

    return NextResponse.json({
      success: true,
      user: {
        publicKey: updatedUser?.publicKey,
        username: updatedUser?.username,
        tier: updatedUser?.tier,
        access: updatedUser?.access,
        shippingName: updatedUser?.shippingName,
        shippingAddress: updatedUser?.shippingAddress,
        shippingCity: updatedUser?.shippingCity,
        shippingZip: updatedUser?.shippingZip,
        createdAt: updatedUser?.createdAt,
        lastLogin: updatedUser?.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('Admin users PATCH route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
