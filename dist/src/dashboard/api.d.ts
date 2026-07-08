export interface ApiResponse {
    status: number;
    headers?: Record<string, string>;
    body: string;
}
export declare function handleDashboardApi(request: Request): Promise<ApiResponse | null>;
