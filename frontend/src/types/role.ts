// Backend'den dönen birim rolü modeli.
export interface Role {
    id: number;
    name: string;
}

export interface RoleUser {
    id: number;
    name: string;
    username: string;
    email: string;
    isActive: boolean;
}

export interface RoleWithUsers {
    id: number;
    name: string;
    isSystemRole: boolean;
    isActive: boolean;
    userCount: number;
    users: RoleUser[];
}