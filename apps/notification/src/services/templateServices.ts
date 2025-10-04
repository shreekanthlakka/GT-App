// // notification-service/src/services/templateService.ts
// import Handlebars from "handlebars";
// import { prisma } from "@repo/db/prisma";

// export class TemplateService {
//     private templates: Map<string, any> = new Map();

//     async loadTemplates(): Promise<void> {
//         const templates = await prisma.notificationTemplate.findMany({
//             where: { isActive: true },
//         });

//         templates.forEach((template) => {
//             this.templates.set(template.name, template);
//         });
//     }

//     async renderTemplate(
//         templateName: string,
//         data: Record<string, any>
//     ): Promise<string> {
//         // Try to get from cache first
//         let template = this.templates.get(templateName);

//         // If not in cache, fetch from database
//         if (!template) {
//             template = await prisma.notificationTemplate.findUnique({
//                 where: { name: templateName },
//             });

//             if (template) {
//                 this.templates.set(templateName, template);
//             }
//         }

//         if (!template) {
//             throw new Error(`Template not found: ${templateName}`);
//         }

//         const compiledTemplate = Handlebars.compile(template.content);
//         return compiledTemplate(data);
//     }

//     async renderString(
//         content: string,
//         data: Record<string, any>
//     ): Promise<string> {
//         const compiledTemplate = Handlebars.compile(content);
//         return compiledTemplate(data);
//     }

//     // Helper method to register custom Handlebars helpers
//     registerHelpers(): void {
//         Handlebars.registerHelper("currency", (amount: number) => {
//             return `₹${amount.toLocaleString("en-IN")}`;
//         });

//         Handlebars.registerHelper("date", (date: string) => {
//             return new Date(date).toLocaleDateString("en-IN");
//         });

//         Handlebars.registerHelper("eq", (a: any, b: any) => {
//             return a === b;
//         });

//         Handlebars.registerHelper("gt", (a: number, b: number) => {
//             return a > b;
//         });
//     }
// }

// notification-service/src/services/templateService.ts
import Handlebars from "handlebars";
import { prisma } from "@repo/db/prisma";

export class TemplateService {
    private templates: Map<string, any> = new Map();

    async loadTemplates(): Promise<void> {
        const templates = await prisma.notificationTemplate.findMany({
            where: { isActive: true },
        });

        templates.forEach((template) => {
            this.templates.set(template.name, template);
        });
    }

    // FIX 1: Change return type to match what NotificationService expects
    async renderTemplate(
        templateName: string,
        data: Record<string, any>
    ): Promise<{ content: string; subject?: string }> {
        // Try to get from cache first
        let template = this.templates.get(templateName);

        // If not in cache, fetch from database
        if (!template) {
            template = await prisma.notificationTemplate.findUnique({
                where: { name: templateName },
            });

            if (template) {
                this.templates.set(templateName, template);
            }
        }

        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }

        const compiledTemplate = Handlebars.compile(template.content);
        const renderedContent = compiledTemplate(data);

        // Handle subject rendering if it exists and has variables
        let renderedSubject: string | undefined;
        if (template.subject) {
            if (template.subject.includes("{{")) {
                const compiledSubject = Handlebars.compile(template.subject);
                renderedSubject = compiledSubject(data);
            } else {
                renderedSubject = template.subject;
            }
        }

        return {
            content: renderedContent,
            subject: renderedSubject,
        };
    }

    // FIX 2: Add the missing getTemplateInfo method
    async getTemplateInfo(
        templateName: string
    ): Promise<{ channel: string } | null> {
        let template = this.templates.get(templateName);

        if (!template) {
            template = await prisma.notificationTemplate.findUnique({
                where: { name: templateName },
            });
        }

        return template ? { channel: template.channel } : null;
    }

    async renderString(
        content: string,
        data: Record<string, any>
    ): Promise<string> {
        const compiledTemplate = Handlebars.compile(content);
        return compiledTemplate(data);
    }

    // Keep your existing helper registration
    registerHelpers(): void {
        Handlebars.registerHelper("currency", (amount: number) => {
            return `₹${amount.toLocaleString("en-IN")}`;
        });

        Handlebars.registerHelper("date", (date: string) => {
            return new Date(date).toLocaleDateString("en-IN");
        });

        Handlebars.registerHelper("eq", (a: any, b: any) => {
            return a === b;
        });

        Handlebars.registerHelper("gt", (a: number, b: number) => {
            return a > b;
        });
    }
}
