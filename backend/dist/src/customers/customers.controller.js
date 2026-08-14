"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let CustomersController = class CustomersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCustomers(req) {
        const { businessId } = req.user;
        return this.prisma.customer.findMany({
            where: { businessId },
            orderBy: { name: 'asc' },
        });
    }
    async upsertCustomer(req, body) {
        const { businessId } = req.user;
        const { id, name, phone, creditLimit, outstandingBalance } = body;
        return this.prisma.customer.upsert({
            where: { id },
            update: {
                name,
                phone,
                creditLimit: creditLimit || 0.0,
                outstandingBalance: outstandingBalance || 0.0,
            },
            create: {
                id,
                businessId,
                name,
                phone,
                creditLimit: creditLimit || 0.0,
                outstandingBalance: outstandingBalance || 0.0,
            },
        });
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "upsertCustomer", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('api/v1/customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map