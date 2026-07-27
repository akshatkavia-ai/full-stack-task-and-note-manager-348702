const statusLabels = {
  done: "Done",
  in_progress: "In progress",
  todo: "To do"
};

// PUBLIC_INTERFACE
/**
 * Displays the collection of tasks with controls for editing and deletion.
 *
 * @param {{ tasks: Array<object>, isDeletingId: string | number | null, onEdit: (task: object) => void, onDelete: (task: object) => void }} props - Task data and action handlers.
 * @returns {JSX.Element} A task list or an empty-state panel.
 */
export default function TaskList({
  tasks,
  isDeletingId,
  onDelete,
  onEdit
}) {
  if (tasks.length === 0) {
    return (
      <section className="empty-state">
        <h2>No tasks yet</h2>
        <p>Create your first task to turn an idea into a clear next step.</p>
      </section>
    );
  }

  return (
    <section aria-label="Task list" className="task-list">
      {tasks.map((task) => (
        <article className="task-card" key={task.id}>
          <div className="task-card__content">
            <span className={`status status--${task.status}`}>
              {statusLabels[task.status] || "To do"}
            </span>
            <h2>{task.title}</h2>
            {task.description && <p>{task.description}</p>}
          </div>
          <div className="task-card__actions">
            <button
              className="text-button"
              onClick={() => onEdit(task)}
              type="button"
            >
              Edit
            </button>
            <button
              className="text-button text-button--danger"
              disabled={isDeletingId === task.id}
              onClick={() => onDelete(task)}
              type="button"
            >
              {isDeletingId === task.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
