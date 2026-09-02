import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
    }));
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
await bootstrap();
//# sourceMappingURL=main.js.map