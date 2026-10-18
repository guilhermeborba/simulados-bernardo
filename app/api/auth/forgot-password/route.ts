import type { NextRequest } from 'next/server';
import { passwordRecoveryResponse } from '@/lib/passwordRecovery.server';

export function POST(request: NextRequest) { return passwordRecoveryResponse(request, '/auth/forgot-password'); }
