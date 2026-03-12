import type { Block } from "@blocknote/core";

export interface Note {
    _id: string;
    title: string;
    order: number;
    content: Block[];
    categoryId: string;
    deleted_at: string;
    createdAt: string;
    updatedAt: string;
    pinned: boolean;
}