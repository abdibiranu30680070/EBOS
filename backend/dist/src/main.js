"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://localhost:4173',
            'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`[EBOS Backend] Listening on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map