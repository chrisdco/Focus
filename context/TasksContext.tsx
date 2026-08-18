import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { filterTasksByProject, filterTasksByView } from "../domain/taskFilters";
import {
  loadActiveTaskId,
  loadProjects,
  loadTasks,
  saveActiveTaskId,
  saveProjects,
  saveTasks,
} from "../storage";
import type { Project, Task, TaskDraft, TaskView } from "../types/task";
import {
  INBOX_PROJECT_ID,
  createDefaultProject,
  createEmptyTaskDraft,
} from "../types/task";
import { toDateKey } from "../utils/timer";

const createId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface TasksContextValue {
  tasks: Task[];
  projects: Project[];
  activeTaskId: string | null;
  activeTask: Task | null;
  isHydrated: boolean;
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  setActiveTaskId: (taskId: string | null) => void;
  getTasksForView: (view: TaskView) => Task[];
  createTask: (draft: TaskDraft) => Task;
  updateTask: (taskId: string, patch: Partial<TaskDraft & { status: Task["status"] }>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  incrementTaskPomodoros: (taskId: string) => void;
  createProject: (name: string, color: string) => Project;
  deleteProject: (projectId: string) => void;
  resetTasks: () => void;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([createDefaultProject()]);
  const [activeTaskId, setActiveTaskIdState] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedTasks, storedProjects, storedActiveTaskId] =
        await Promise.all([loadTasks(), loadProjects(), loadActiveTaskId()]);

      setTasks(storedTasks);
      setProjects(storedProjects);
      setActiveTaskIdState(storedActiveTaskId);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persistTasks = useCallback(async (nextTasks: Task[]) => {
    await saveTasks(nextTasks);
  }, []);

  const persistProjects = useCallback(async (nextProjects: Project[]) => {
    await saveProjects(nextProjects);
  }, []);

  const setActiveTaskId = useCallback((taskId: string | null) => {
    setActiveTaskIdState(taskId);
    void saveActiveTaskId(taskId);
  }, []);

  const getTasksForView = useCallback(
    (view: TaskView): Task[] => {
      const filtered = filterTasksByView(tasks, view, toDateKey(Date.now()));
      return filterTasksByProject(filtered, selectedProjectId);
    },
    [tasks, selectedProjectId]
  );

  const createTask = useCallback(
    (draft: TaskDraft): Task => {
      const task: Task = {
        id: createId(),
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        projectId: draft.projectId,
        estimatedPomodoros: Math.max(1, draft.estimatedPomodoros),
        completedPomodoros: 0,
        priority: draft.priority,
        dueDate: draft.dueDate,
        tags: draft.tags,
        status: "active",
        createdAt: Date.now(),
        completedAt: null,
      };

      setTasks((prev) => {
        const next = [...prev, task];
        void persistTasks(next);
        return next;
      });

      return task;
    },
    [persistTasks]
  );

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<TaskDraft & { status: Task["status"] }>
    ) => {
      setTasks((prev) => {
        const next = prev.map((task) => {
          if (task.id !== taskId) {
            return task;
          }

          return {
            ...task,
            ...patch,
            title: patch.title !== undefined ? patch.title.trim() : task.title,
            notes: patch.notes !== undefined ? patch.notes.trim() : task.notes,
            estimatedPomodoros:
              patch.estimatedPomodoros !== undefined
                ? Math.max(1, patch.estimatedPomodoros)
                : task.estimatedPomodoros,
            completedAt:
              patch.status === "completed"
                ? Date.now()
                : patch.status === "active"
                  ? null
                  : task.completedAt,
          };
        });
        void persistTasks(next);
        return next;
      });
    },
    [persistTasks]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const next = prev.filter((task) => task.id !== taskId);
        void persistTasks(next);
        return next;
      });

      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    },
    [activeTaskId, setActiveTaskId]
  );

  const completeTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: "completed" });
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    },
    [activeTaskId, setActiveTaskId, updateTask]
  );

  const incrementTaskPomodoros = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const next = prev.map((task) => {
          if (task.id !== taskId) {
            return task;
          }

          const completedPomodoros = task.completedPomodoros + 1;
          const reachedEstimate =
            completedPomodoros >= task.estimatedPomodoros;

          return {
            ...task,
            completedPomodoros,
            status: reachedEstimate ? ("completed" as const) : task.status,
            completedAt: reachedEstimate ? Date.now() : task.completedAt,
          };
        });
        void persistTasks(next);
        return next;
      });
    },
    [persistTasks]
  );

  const createProject = useCallback(
    (name: string, color: string): Project => {
      const project: Project = {
        id: createId(),
        name: name.trim(),
        color,
        sortOrder: projects.length,
        createdAt: Date.now(),
      };

      setProjects((prev) => {
        const next = [...prev, project];
        void persistProjects(next);
        return next;
      });

      return project;
    },
    [persistProjects, projects.length]
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      if (projectId === INBOX_PROJECT_ID) {
        return;
      }

      setProjects((prev) => {
        const next = prev.filter((project) => project.id !== projectId);
        void persistProjects(next);
        return next;
      });

      setTasks((prev) => {
        const next = prev.map((task) =>
          task.projectId === projectId
            ? { ...task, projectId: INBOX_PROJECT_ID }
            : task
        );
        void persistTasks(next);
        return next;
      });

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    },
    [persistTasks, persistProjects, selectedProjectId]
  );

  const resetTasks = useCallback(() => {
    const defaults = [createDefaultProject()];
    setTasks([]);
    setProjects(defaults);
    setActiveTaskId(null);
    setSelectedProjectId(null);
    void persistTasks([]);
    void persistProjects(defaults);
  }, [persistTasks, persistProjects, setActiveTaskId]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  const value = useMemo(
    () => ({
      tasks,
      projects,
      activeTaskId,
      activeTask,
      isHydrated,
      selectedProjectId,
      setSelectedProjectId,
      setActiveTaskId,
      getTasksForView,
      createTask,
      updateTask,
      deleteTask,
      completeTask,
      incrementTaskPomodoros,
      createProject,
      deleteProject,
      resetTasks,
    }),
    [
      tasks,
      projects,
      activeTaskId,
      activeTask,
      isHydrated,
      selectedProjectId,
      getTasksForView,
      createTask,
      updateTask,
      deleteTask,
      completeTask,
      incrementTaskPomodoros,
      createProject,
      deleteProject,
      resetTasks,
    ]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
};

export const useTasks = (): TasksContextValue => {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }

  return context;
};

export { createEmptyTaskDraft };
