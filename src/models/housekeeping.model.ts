export class HousekeepingTask {
    taskId: number = 0;
    roomId: number = 0;
    roomNumber: string = '';
    taskType: string = '';
    status: string = '';
    createdAt: string = '';
}

// Matches backend TaskStatus enum (Models/HousekeepingTask.cs)
export enum TaskStatus {
    Created = 1,
    Assigned = 2,
    InProgress = 3,
    Completed = 4,
}

// Matches backend TaskPriority enum (Models/HousekeepingTask.cs)
export enum TaskPriority {
    Low = 1,
    Medium = 2,
    High = 3,
}

// Matches backend HouseKeepingTaskResponse DTO, returned by GET HouseKeeping/my-tasks
export class MyHousekeepingTask {
    taskId: number = 0;
    roomId: number = 0;
    roomNumber: string = '';
    assignedEmployeeId: number | null = null;
    employeeName: string | null = null;
    taskType: string = '';
    status: string = '';
    // Serialized as a string (e.g. "Low" | "Medium" | "High") by the backend's JsonStringEnumConverter
    priority: string = 'Medium';
    assignedAt: string | null = null;
    inProgressAt: string | null = null;
    completedAt: string | null = null;
    isActive: boolean = true;
}

export class ActiveTasks {
    taskId: number = 0;
    roomNumber: number = 0;
    taskType: string = '';
    createdAt: string = '';
    assignedTo: string = '';
    assignedAt: string | null = null;
    status: string = '';
}