import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "./api/tasksApi";

jest.mock("./api/tasksApi", () => ({
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  getTasks: jest.fn(),
  updateTask: jest.fn()
}));

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it("shows a loading state then an empty state", async () => {
    getTasks.mockResolvedValue([]);

    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading tasks");
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("creates a task after validating required fields", async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([]);
    createTask.mockResolvedValue({
      description: "Prepare the first draft",
      id: "task-1",
      status: "todo",
      title: "Write proposal"
    });

    render(<App />);
    await screen.findByText("No tasks yet");

    await user.click(screen.getByRole("button", { name: /new task/i }));
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(
      screen.getByText("A task title is required.")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/task title/i), "Write proposal");
    await user.type(
      screen.getByLabelText("Description"),
      "Prepare the first draft"
    );
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith({
        description: "Prepare the first draft",
        status: "todo",
        title: "Write proposal"
      })
    );
    expect(await screen.findByText("Task created successfully.")).toBeInTheDocument();
    expect(screen.getByText("Write proposal")).toBeInTheDocument();
  });

  it("edits and deletes an existing task", async () => {
    const user = userEvent.setup();
    const task = {
      description: "Initial description",
      id: "task-2",
      status: "todo",
      title: "Original task"
    };

    getTasks.mockResolvedValue([task]);
    updateTask.mockResolvedValue({ ...task, status: "done", title: "Updated task" });
    deleteTask.mockResolvedValue(undefined);

    render(<App />);
    expect(await screen.findByText("Original task")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const titleInput = screen.getByLabelText(/task title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated task");
    await user.selectOptions(screen.getByLabelText("Status"), "done");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith("task-2", {
        description: "Initial description",
        status: "done",
        title: "Updated task"
      })
    );
    expect(await screen.findByText("Task updated successfully.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith("task-2"));
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("does not delete when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([{ id: "task-3", status: "todo", title: "Keep me" }]);
    window.confirm.mockReturnValue(false);

    render(<App />);
    expect(await screen.findByText("Keep me")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteTask).not.toHaveBeenCalled();
    expect(screen.getByText("Keep me")).toBeInTheDocument();
  });

  it("shows an API failure in the notification area", async () => {
    getTasks.mockRejectedValue(new Error("Task service is unavailable."));

    render(<App />);

    expect(
      await screen.findByText("Task service is unavailable.")
    ).toBeInTheDocument();
  });

  it("dismisses an active notification", async () => {
    getTasks.mockRejectedValue(new Error("Temporary failure."));
    const user = userEvent.setup();

    render(<App />);
    expect(await screen.findByText("Temporary failure.")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Dismiss notification"));

    expect(screen.queryByText("Temporary failure.")).not.toBeInTheDocument();
  });

  it("keeps the dialog open and reports a failed save", async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([]);
    createTask.mockRejectedValue(new Error("Title already exists."));

    render(<App />);
    await screen.findByText("No tasks yet");
    await user.click(screen.getByRole("button", { name: /new task/i }));
    await user.type(screen.getByLabelText(/task title/i), "Duplicate");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Title already exists.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports a failed delete and keeps the task visible", async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([{ id: "task-4", status: "todo", title: "Cannot remove" }]);
    deleteTask.mockRejectedValue(new Error("Deletion failed."));

    render(<App />);
    await screen.findByText("Cannot remove");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Deletion failed.")).toBeInTheDocument();
    expect(screen.getByText("Cannot remove")).toBeInTheDocument();
  });

  it("closes the form through the cancel button", async () => {
    const user = userEvent.setup();
    getTasks.mockResolvedValue([]);

    render(<App />);
    await screen.findByText("No tasks yet");
    await user.click(screen.getByRole("button", { name: /new task/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("enforces the description length limit before submitting", async () => {
    getTasks.mockResolvedValue([]);

    render(<App />);
    await screen.findByText("No tasks yet");
    fireEvent.click(screen.getByRole("button", { name: /new task/i }));
    fireEvent.change(screen.getByLabelText(/task title/i), {
      target: { value: "A valid title" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "a".repeat(501) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(
      screen.getByText("A description must be 500 characters or fewer.")
    ).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });
});
