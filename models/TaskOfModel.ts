export interface ITaskOf {
    status: string;
    tasks: Array<{
        taskId: string;
        title: string;
        category: string;
        imageUrl?: string | null;
        locationName?: string;
        wages: number; // smallest unit
        startDate: Date;
        endDate: Date;
    }>;
}
