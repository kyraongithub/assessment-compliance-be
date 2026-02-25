import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UpsertUserDto {
  email: string;
  name?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(dto: UpsertUserDto) {
    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        name: dto.name,
      },
      create: {
        email: dto.email,
        name: dto.name,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
