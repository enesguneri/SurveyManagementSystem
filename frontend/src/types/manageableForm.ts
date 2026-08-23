import type { FormAccessType } from "./form";

export type FormStatus =
    | "Draft"
    | "Published"
    | "Closed";

export interface ManageableForm {
    id: number;
    publicId: string;
    title: string;
    description: string | null;
    status: FormStatus;
    accessType: FormAccessType;
    createdAt: string;
    createdByUserId: number;
    createdByUserName: string;
    roleNames: string[];
}