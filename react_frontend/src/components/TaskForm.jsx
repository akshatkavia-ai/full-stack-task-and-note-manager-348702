import { useEffect, useState } from "react";

const DEFAULT_TASK = {
  description: "",
  status: "todo",
  title: ""
};

function validateTask(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = "A task title is required.";
  } else if (values.title.trim().length > 120) {
    errors.title = "A task title must be 120 characters or fewer.";
  }

  if (values.description.length > 500) {
    errors.description = "A description must be 500 characters or fewer.";
  }

  return errors;
}

// PUBLIC_INTERFACE
/**
 * Renders the modal used for creating or editing a task.
 *
 * @param {{ task: object | null, isSaving: boolean, onClose: () => void, onSubmit: (task: object) => Promise<void> }} props - Dialog state and save callbacks.
 * @returns {JSX.Element} An accessible task form dialog.
 */
export default function TaskForm({ task, isSaving, onClose, onSubmit }) {
  const [values, setValues] = useState(DEFAULT_TASK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(
      task
        ? {
            description: task.description || "",
            status: task.status || "todo",
            title: task.title || ""
          }
        : DEFAULT_TASK
    );
    setErrors({});
  }, [task]);

  const isEditing = Boolean(task);

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));

    if (errors[name]) {
      setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateTask(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      description: values.description.trim(),
      status: values.status,
      title: values.title.trim()
    });
  }

  return (
    <div
      aria-labelledby="task-form-title"
      aria-modal="true"
      className="dialog-backdrop"
      role="dialog"
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{isEditing ? "Update work" : "Plan work"}</p>
            <h2 id="task-form-title">
              {isEditing ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            aria-label="Close task form"
            className="icon-button"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <label htmlFor="task-title">
          Task title <span aria-hidden="true">*</span>
        </label>
        <input
          aria-describedby={errors.title ? "task-title-error" : undefined}
          aria-invalid={Boolean(errors.title)}
          autoFocus
          disabled={isSaving}
          id="task-title"
          maxLength="121"
          name="title"
          onChange={updateValue}
          value={values.title}
        />
        {errors.title && (
          <p className="field-error" id="task-title-error" role="alert">
            {errors.title}
          </p>
        )}

        <label htmlFor="task-description">Description</label>
        <textarea
          aria-describedby={
            errors.description ? "task-description-error" : undefined
          }
          aria-invalid={Boolean(errors.description)}
          disabled={isSaving}
          id="task-description"
          maxLength="501"
          name="description"
          onChange={updateValue}
          rows="4"
          value={values.description}
        />
        {errors.description && (
          <p className="field-error" id="task-description-error" role="alert">
            {errors.description}
          </p>
        )}

        <label htmlFor="task-status">Status</label>
        <select
          disabled={isSaving}
          id="task-status"
          name="status"
          onChange={updateValue}
          value={values.status}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>

        <div className="form-actions">
          <button
            className="button button--secondary"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button className="button" disabled={isSaving} type="submit">
            {isSaving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
