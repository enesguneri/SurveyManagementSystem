import type { FormAccessType } from "./form";
import type { PublishedForm } from "./publishedForm";

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
    // Forma gönderilen toplam yanıt sayısı.
    responseCount: number;
}

// Taslak form düzenleme ekranında kullanılacak detay modeli.
export interface ManageableFormDetails
    extends PublishedForm {
    roleIds: number[];
}