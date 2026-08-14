import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(username: string, pass: string, businessId: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            fullName: any;
            role: any;
            businessId: any;
            branchId: any;
            businessName: any;
            branchName: any;
        };
    }>;
    validateToken(token: string): Promise<any>;
}
