import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserReview } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async getReviews(params: {
    userId: number;
    skip?: number;
    take?: number;
    cursor?: Prisma.UserReviewWhereUniqueInput;
    orderBy?: Prisma.UserReviewOrderByWithRelationInput;
  }) {
    const { userId, skip, take, cursor, orderBy } = params;

    const totalCount = await this.prisma.userReview.count({
      where: {
        targetUser: {
          id: userId,
        },
      },
    });

    const averageRating = await this.computeAverageRating(userId);

    const reviews = await this.prisma.userReview.findMany({
      skip,
      take,
      cursor,
      where: {
        targetUser: {
          id: userId,
        },
      },
      orderBy,
    });

    return {
      reviews,
      averageRating: averageRating._avg.rating,
      totalCount,
    };
  }

  computeAverageRating(userId: number) {
    return this.prisma.userReview.aggregate({
      where: {
        targetUser: {
          id: userId,
        },
      },
      _avg: {
        rating: true,
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
