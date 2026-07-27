const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
).replace(/\/$/, "");

/**
 * Converts a failed API response into a concise message suitable for the UI.
 *
 * @param {Response} response - The failed fetch response.
 * @returns {Promise<string>} A normalized error message.
 */
async function readErrorMessage(response) {
  try {
    const body = await response.json();

    if (typeof body.detail === "string") {
      return body.detail;
    }

    if (typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // A non-JSON error response falls back to the HTTP status text below.
  }

  return response.statusText || "The request could not be completed.";
}

/**
 * Sends a request to the backend tasks API and parses its JSON response.
 *
 * @param {string} path - API path relative to the configured backend URL.
 * @param {RequestInit} [options] - Fetch options for the request.
 * @returns {Promise<unknown>} Parsed response data.
 * @throws {Error} When the request fails or the backend returns an error.
 */
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });
  } catch {
    throw new Error(
      "Unable to reach the task service. Please check your connection and try again."
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Gets every task from the backend.
 *
 * @returns {Promise<Array<object>>} The current task list.
 */
export function getTasks() {
  return request("/tasks");
}

// PUBLIC_INTERFACE
/**
 * Creates a new task.
 *
 * @param {object} task - The validated task fields to create.
 * @returns {Promise<object>} The created task.
 */
export function createTask(task) {
  return request("/tasks", {
    body: JSON.stringify(task),
    method: "POST"
  });
}

// PUBLIC_INTERFACE
/**
 * Updates an existing task.
 *
 * @param {string|number} taskId - The task identifier.
 * @param {object} task - The validated replacement fields.
 * @returns {Promise<object>} The updated task.
 */
export function updateTask(taskId, task) {
  return request(`/tasks/${taskId}`, {
    body: JSON.stringify(task),
    method: "PUT"
  });
}

// PUBLIC_INTERFACE
/**
 * Deletes an existing task.
 *
 * @param {string|number} taskId - The task identifier.
 * @returns {Promise<void>} Resolves after deletion succeeds.
 */
export function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, {
    method: "DELETE"
  });
}
