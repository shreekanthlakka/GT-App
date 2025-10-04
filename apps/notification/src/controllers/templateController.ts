// import {
//     asyncHandler,
//     CustomError,
//     CustomResponse,
// } from "@repo/common-backend/utils";
// import { prisma } from "@repo/db/prisma";
// import { TemplateService } from "../services/templateServices";

// export const getTemplates = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 50, channel, type, isActive, search } = req.query;

//     const where: any = {};
//     if (channel) where.channel = channel;
//     if (type) where.type = type;
//     if (isActive !== undefined) where.isActive = isActive === "true";
//     if (search) {
//         where.OR = [
//             { name: { contains: search as string, mode: "insensitive" } },
//             { content: { contains: search as string, mode: "insensitive" } },
//         ];
//     }

//     const [templates, total] = await Promise.all([
//         prisma.notificationTemplate.findMany({
//             where,
//             skip: (Number(page) - 1) * Number(limit),
//             take: Number(limit),
//             orderBy: { createdAt: "desc" },
//         }),
//         prisma.notificationTemplate.count({ where }),
//     ]);

//     res.json(
//         new CustomResponse(200, "Templates retrieved successfully", {
//             templates,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(total / Number(limit)),
//                 totalItems: total,
//             },
//         })
//     );
// });

// export const createTemplate = asyncHandler(async (req, res) => {
//     const { name, channel, type, subject, content, variables, isActive } =
//         req.body;

//     // Check if template name already exists
//     const existingTemplate = await prisma.notificationTemplate.findUnique({
//         where: { name },
//     });

//     if (existingTemplate) {
//         throw new CustomError(409, "Template with this name already exists");
//     }

//     const template = await prisma.notificationTemplate.create({
//         data: {
//             name,
//             channel,
//             type,
//             subject,
//             content,
//             variables: variables || {},
//             isActive: isActive ?? true,
//         },
//     });

//     const response = new CustomResponse(201, "Template created successfully", {
//         template,
//     });

//     res.status(response.statusCode).json(response);
// });

// export const getTemplateById = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     const template = await prisma.notificationTemplate.findUnique({
//         where: { id },
//     });

//     if (!template) {
//         throw new CustomError(404, "Template not found");
//     }

//     res.json(
//         new CustomResponse(200, "Template retrieved successfully", {
//             template,
//         })
//     );
// });

// export const updateTemplate = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const validatedData = CreateTemplateSchema.partial().parse(req.body);

//     const template = await prisma.notificationTemplate.findUnique({
//         where: { id },
//     });

//     if (!template) {
//         throw new CustomError(404, "Template not found");
//     }

//     const updatedTemplate = await prisma.notificationTemplate.update({
//         where: { id },
//         data: validatedData,
//     });

//     res.json(
//         new CustomResponse(200, "Template updated successfully", {
//             template: updatedTemplate,
//         })
//     );
// });

// export const deleteTemplate = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     const template = await prisma.notificationTemplate.findUnique({
//         where: { id },
//     });

//     if (!template) {
//         throw new CustomError(404, "Template not found");
//     }

//     await prisma.notificationTemplate.delete({
//         where: { id },
//     });

//     res.json(new CustomResponse(200, "Template deleted successfully"));
// });

// export const testTemplate = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const { testData } = req.body;

//     const template = await prisma.notificationTemplate.findUnique({
//         where: { id },
//     });

//     if (!template) {
//         throw new CustomError(404, "Template not found");
//     }

//     // Render template with test data
//     const templateService = new TemplateService();
//     const renderedContent = await templateService.renderTemplate(
//         template.name,
//         testData || {}
//     );

//     const response = new CustomResponse(200, "Template rendered successfully", {
//         originalContent: template.content,
//         renderedContent,
//         testData,
//         variables: template.variables,
//     });

//     res.status(response.statusCode).json(response);
// });

import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomResponse,
    CustomError,
} from "@repo/common-backend/utils";
import { TemplateService } from "../services/templateServices";

export const createTemplate = asyncHandler(
    async (req: Request, res: Response) => {
        const templateData = req.parsedBody;

        const existingTemplate = await prisma.notificationTemplate.findFirst({
            where: { name: templateData.name },
        });

        if (existingTemplate) {
            throw new CustomError(
                409,
                "Template with this name already exists"
            );
        }

        const template = await prisma.notificationTemplate.create({
            data: templateData,
        });

        res.status(201).json(
            new CustomResponse(201, "Template created successfully", {
                template,
            })
        );
    }
);

export const getTemplates = asyncHandler(
    async (req: Request, res: Response) => {
        const params = req.parsedQuery;

        const where: any = {};
        if (params.channel) where.channel = params.channel;
        if (params.type) where.type = params.type;
        if (params.isActive !== undefined)
            where.isActive = params.isActive === "true";
        if (params.category) where.category = params.category;
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: "insensitive" } },
                { content: { contains: params.search, mode: "insensitive" } },
            ];
        }

        const [templates, total] = await Promise.all([
            prisma.notificationTemplate.findMany({
                where,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
                orderBy: { [params.sortBy]: params.sortOrder },
            }),
            prisma.notificationTemplate.count({ where }),
        ]);

        res.json(
            new CustomResponse(200, "Templates retrieved successfully", {
                templates,
                pagination: {
                    currentPage: params.page,
                    totalPages: Math.ceil(total / params.limit),
                    totalItems: total,
                    itemsPerPage: params.limit,
                    hasNextPage: params.page < Math.ceil(total / params.limit),
                    hasPrevPage: params.page > 1,
                },
            })
        );
    }
);

export const getTemplateById = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const template = await prisma.notificationTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new CustomError(404, "Template not found");
        }

        res.json(
            new CustomResponse(200, "Template retrieved successfully", {
                template,
            })
        );
    }
);

export const updateTemplate = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateData = req.parsedBody;

        const template = await prisma.notificationTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new CustomError(404, "Template not found");
        }

        if (updateData.name && updateData.name !== template.name) {
            const existingTemplate =
                await prisma.notificationTemplate.findFirst({
                    where: {
                        name: updateData.name,
                        id: { not: id },
                    },
                });

            if (existingTemplate) {
                throw new CustomError(
                    409,
                    "Template with this name already exists"
                );
            }
        }

        const updatedTemplate = await prisma.notificationTemplate.update({
            where: { id },
            data: updateData,
        });

        res.json(
            new CustomResponse(200, "Template updated successfully", {
                template: updatedTemplate,
            })
        );
    }
);

export const deleteTemplate = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const template = await prisma.notificationTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new CustomError(404, "Template not found");
        }

        await prisma.notificationTemplate.delete({
            where: { id },
        });

        res.json(new CustomResponse(200, "Template deleted successfully"));
    }
);

export const testTemplate = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { templateData, recipient } = req.parsedBody;

        const template = await prisma.notificationTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new CustomError(404, "Template not found");
        }

        const templateService = new TemplateService();

        try {
            const renderedContent = await templateService.renderTemplate(
                template.name,
                templateData
            );

            let renderedSubject: string | undefined;
            if (template.subject) {
                renderedSubject = await templateService.renderString(
                    template.subject,
                    templateData
                );
            }

            res.json(
                new CustomResponse(200, "Template rendered successfully", {
                    original: {
                        subject: template.subject,
                        content: template.content,
                    },
                    rendered: {
                        subject: renderedSubject,
                        content: renderedContent,
                    },
                    templateData,
                    variables: template.variables,
                })
            );
        } catch (error: any) {
            throw new CustomError(
                400,
                `Template rendering failed: ${error.message}`
            );
        }
    }
);

export const duplicateTemplate = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name } = req.parsedBody;

        const originalTemplate = await prisma.notificationTemplate.findUnique({
            where: { id },
        });

        if (!originalTemplate) {
            throw new CustomError(404, "Template not found");
        }

        const existingTemplate = await prisma.notificationTemplate.findFirst({
            where: { name },
        });

        if (existingTemplate) {
            throw new CustomError(
                409,
                "Template with this name already exists"
            );
        }

        const duplicatedTemplate = await prisma.notificationTemplate.create({
            data: {
                name,
                channel: originalTemplate.channel,
                type: originalTemplate.type,
                subject: originalTemplate.subject,
                content: originalTemplate.content,
                variables: originalTemplate.variables ?? {},
                metadata: originalTemplate.metadata ?? {},
                isActive: false,
                category: originalTemplate.category,
                description: `Copy of ${originalTemplate.description || originalTemplate.name}`,
            },
        });

        res.status(201).json(
            new CustomResponse(201, "Template duplicated successfully", {
                template: duplicatedTemplate,
            })
        );
    }
);

export const bulkUpdateTemplates = asyncHandler(
    async (req: Request, res: Response) => {
        const { templateIds, action, data } = req.parsedBody;

        let updateData: any = {};

        switch (action) {
            case "activate":
                updateData = { isActive: true };
                break;
            case "deactivate":
                updateData = { isActive: false };
                break;
            case "update_category":
                if (!data?.category) {
                    throw new CustomError(
                        400,
                        "Category is required for this action"
                    );
                }
                updateData = { category: data.category };
                break;
            default:
                throw new CustomError(400, "Invalid action");
        }

        const result = await prisma.notificationTemplate.updateMany({
            where: { id: { in: templateIds } },
            data: updateData,
        });

        res.json(
            new CustomResponse(
                200,
                `${result.count} templates updated successfully`,
                {
                    updatedCount: result.count,
                    action,
                    templateIds,
                }
            )
        );
    }
);

export const exportTemplates = asyncHandler(
    async (req: Request, res: Response) => {
        const { format, templateIds } = req.parsedQuery;

        const where: any = {};
        if (templateIds) {
            const ids = templateIds.split(",");
            where.id = { in: ids };
        }

        const templates = await prisma.notificationTemplate.findMany({
            where,
            select: {
                name: true,
                channel: true,
                type: true,
                subject: true,
                content: true,
                variables: true,
                metadata: true,
                category: true,
                description: true,
            },
        });

        if (format === "csv") {
            const csv = convertTemplatesToCSV(templates);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=templates.csv"
            );
            res.send(csv);
        } else {
            res.setHeader("Content-Type", "application/json");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=templates.json"
            );
            res.json(templates);
        }
    }
);

function convertTemplatesToCSV(templates: any[]): string {
    const headers = [
        "name",
        "channel",
        "type",
        "subject",
        "content",
        "category",
        "description",
    ];
    const csvRows = [headers.join(",")];

    for (const template of templates) {
        const row = headers.map((header) => {
            const value = template[header] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(","));
    }

    return csvRows.join("\n");
}
