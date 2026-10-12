export type ApiResponse<T> = {
  statusCode?: number;
  message?: string;
  data: T;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
