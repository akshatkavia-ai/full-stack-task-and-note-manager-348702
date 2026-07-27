import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "./api/tasksApi";
import Notification from "./components/Notification";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

// PUBLIC_INTERFACE
/**
 * Provides the complete task management user experience.
 *
 * @returns {JSX.Element} The task manager application.
 */
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ message, type });
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getTasks();
      setTasks(Array.isArray(response) ? response : response.items || []);
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function openCreateForm() {
    setEditingTask(null);
    setIsFormOpen(true);
  }

  function openEditForm(task) {
    setEditingTask(task);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (!isSaving) {
      setIsFormOpen(false);
      setEditingTask(null);
    }
  }

  async function saveTask(values) {
    setIsSaving(true);

    try {
      if (editingTask) {
        const updatedTask = await updateTask(editingTask.id, values);
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTask.id ? updatedTask : task
          )
        );
        showNotification("success", "Task updated successfully.");
      } else {
        const createdTask = await createTask(values);
        setTasks((currentTasks) => [createdTask, ...currentTasks]);
        showNotification("success", "Task created successfully.");
      }

      setIsFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeTask(task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeletingId(task.id);

    try {
      await deleteTask(task.id);
      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask.id !== task.id)
      );
      showNotification("success", "Task deleted successfully.");
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark" aria-hidden="true">✓</span>
          <span>TaskFlow</span>
        </a>
        <button className="button" onClick={openCreateForm} type="button">
          <span aria-hidden="true">+</span> New task
        </button>
      </header>

      <main className="main-content">
        <section className="page-intro">
          <p className="eyebrow">Your workspace</p>
          <h1>Keep work moving forward.</h1>
          <p>
            Capture what needs attention, stay focused, and finish with
            confidence.
          </p>
        </section>

        <section className="tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>Tasks</h2>
              <p>{tasks.length} {tasks.length === 1 ? "task" : "tasks"} in your list</p>
            </div>
            <button className="button button--mobile-only" onClick={openCreateForm} type="button">
              New task
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state" role="status">
              Loading tasks…
            </div>
          ) : (
            <TaskList
              isDeletingId={isDeletingId}
              onDelete={removeTask}
              onEdit={openEditForm}
              tasks={tasks}
            />
          )}
        </section>
      </main>

      <Notification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {isFormOpen && (
        <TaskForm
          isSaving={isSaving}
          onClose={closeForm}
          onSubmit={saveTask}
          task={editingTask}
        />
      )}
    </div>
  );
}
