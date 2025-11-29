### common module in packages

```typescript

{
    "name": "@repo/common",
    "version": "1.0.0",
    "description": "",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        "./subjects": "./src/subjects/index.ts",
        "./schemas": "./src/schemas/index.ts",
        "./types": "./src/types/index.ts",
        "./ecommSchemas": "./src/schemas/ecommSchemas.ts",
        "./topics": "./src/kafkaTopics/index.ts"
    },
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "dev": "tsc --watch",
        "build": "tsc",
        "clean": "rm -rf dist"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@repo/typescript-config": "*",
        "zod": "^4.1.5"
    }
}


```

### common-backend package.json file

```typescript
{
    "name": "@repo/common-backend",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "exports": {
        "./interfaces": "./src/events/interfaces/index.ts",
        "./kafka": "./src/kafka/index.ts",
        "./logger": "./src/logger/index.ts",
        "./utils": "./src/utils/index.ts",
        "./middleware": "./src/middleware/index.ts",
        "./validators": "./src/validator/validators.ts",
        "./ecommValidators": "./src/validator/ecommValidators.ts",
        "./publisher": "./src/events/publishers/index.ts",
        "./financialValidators": "./src/validator/financialReportsValidators.ts"
    },
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@repo/common": "*",
        "@repo/typescript-config": "*",
        "bcryptjs": "^3.0.2",
        "express": "^5.1.0",
        "express-rate-limit": "^8.1.0",
        "hi-base32": "^0.5.1",
        "jsonwebtoken": "^9.0.2",
        "kafkajs": "^2.2.4",
        "uuid": "^11.1.0",
        "winston": "^3.17.0",
        "winston-daily-rotate-file": "^5.0.0"
    },
    "devDependencies": {
        "@types/express": "^5.0.3",
        "@types/jsonwebtoken": "^9.0.10"
    }
}

```

### common-backend tsconfig.json

```typescript
{
    "extends": "@repo/typescript-config/node.json",
    "compilerOptions": {
        "composite": true,
        "rootDir": "./src",
        "outDir": "./dist"
    },
    "include": ["src/**/*"]
}

```
