import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "./tasksApi";

function mockResponse({ body, ok = true, status = 200, statusText = "" }) {
  return {
    json: jest.fn().mockResolvedValue(body),
    ok,
    status,
    statusText
  };
}

describe("tasksApi", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists tasks", async () => {
    fetch.mockResolvedValue(mockResponse({ body: [{ id: "1", title: "Task" }] }));

    await expect(getTasks()).resolves.toEqual([{ id: "1", title: "Task" }]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/tasks",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } })
    );
  });

  it("creates and updates tasks using JSON payloads", async () => {
    const values = { description: "Details", status: "todo", title: "New task" };
    fetch
      .mockResolvedValueOnce(mockResponse({ body: { ...values, id: "1" } }))
      .mockResolvedValueOnce(
        mockResponse({ body: { ...values, id: "1", status: "done" } })
      );

    await expect(createTask(values)).resolves.toEqual({ ...values, id: "1" });
    await expect(updateTask("1", values)).resolves.toEqual({
      ...values,
      id: "1",
      status: "done"
    });

    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({ body: JSON.stringify(values), method: "POST" })
    );
    expect(fetch.mock.calls[1][0]).toBe("http://localhost:3001/tasks/1");
    expect(fetch.mock.calls[1][1]).toEqual(
      expect.objectContaining({ body: JSON.stringify(values), method: "PUT" })
    );
  });

  it("supports successful no-content deletion", async () => {
    fetch.mockResolvedValue(mockResponse({ body: undefined, status: 204 }));

    await expect(deleteTask("task-1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/tasks/task-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("uses the server detail for a failed request", async () => {
    fetch.mockResolvedValue(
      mockResponse({
        body: { detail: "Task not found." },
        ok: false,
        status: 404,
        statusText: "Not Found"
      })
    );

    await expect(deleteTask("missing")).rejects.toThrow("Task not found.");
  });

  it("uses the server message and falls back to HTTP status text", async () => {
    fetch
      .mockResolvedValueOnce(
        mockResponse({
          body: { message: "Invalid request." },
          ok: false,
          status: 400
        })
      )
      .mockResolvedValueOnce({
        json: jest.fn().mockRejectedValue(new Error("invalid JSON")),
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      });

    await expect(getTasks()).rejects.toThrow("Invalid request.");
    await expect(getTasks()).rejects.toThrow("Internal Server Error");
  });

  it("normalizes network failures", async () => {
    fetch.mockRejectedValue(new Error("Network unavailable"));

    await expect(getTasks()).rejects.toThrow(
      "Unable to reach the task service. Please check your connection and try again."
    );
  });
});
