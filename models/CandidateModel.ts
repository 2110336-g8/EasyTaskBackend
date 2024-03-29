export interface ICandidate {
    taskId: string;
    capacity: number;
    vacancy: number;
    candidates: {
        pending: Array<{
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber?: string;
            description?: string;
            imageUrl?: string | null;
            appliedAt: Date;
        }>;
        offering: Array<{
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber?: string;
            description?: string;
            imageUrl?: string | null;
            appliedAt: Date;
        }>;
        accepted: Array<{
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber?: string;
            description?: string;
            imageUrl?: string | null;
            appliedAt: Date;
        }>;
    };
}
