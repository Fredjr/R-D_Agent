import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test login endpoint called');

    // Create test user data
    const testUser = {
      user_id: 'fredericle77@gmail.com',
      username: 'Test User',
      email: 'fredericle77@gmail.com',
      created_at: new Date().toISOString(),
      registration_completed: true
    };

    // Return the test user data that can be stored in localStorage
    return NextResponse.json({
      status: 'success',
      message: 'Test user session created',
      user: testUser
    });

  } catch (error) {
    console.error('❌ Test login error:', error);
    return NextResponse.json(
      { error: 'Test login failed' },
      { status: 500 }
    );
  }
}
