export type PendingCountsResponse = {
  code: number;
  message: string;
  data: Record<string, number>;
};

export type PendingCounts = Record<string, number>;
