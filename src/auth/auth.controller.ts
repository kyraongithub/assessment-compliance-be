import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Step 1: Redirect user to Google consent screen
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // Guard handles redirect — this body never executes
  }

  /**
   * Step 2: Google redirects back here after consent
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback — returns JWT' })
  googleCallback(@Req() req: { user: User }, @Res() res: Response) {
    const { access_token } = this.authService.generateToken(req.user);

    // Option A: Redirect to frontend with token in query param
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${access_token}`,
    );

    // Option B: Return JSON (easier for development)
    // return res.json({
    //   access_token,
    //   user: {
    //     id: req.user.id,
    //     email: req.user.email,
    //     name: req.user.name,
    //     role: req.user.role,
    //   },
    // });
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@Req() req: { user: User }) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
  }
}
