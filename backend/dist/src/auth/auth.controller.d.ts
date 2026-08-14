import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
}
