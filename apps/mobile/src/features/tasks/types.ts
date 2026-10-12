export type MobileTask = {
  id: string;
  title: string;
  done: boolean;
  priority: number;
  due_date: string | null;
};

export type TaskListResponse = {
  data: MobileTask[];
  limit: number;
  offset: number;
};

export type TaskResponse = {
  data: MobileTask;
};
