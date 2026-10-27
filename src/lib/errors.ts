// Only these intentionally public messages are sent to the browser or CLI.
export class AppError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function publicError(error: unknown) {
  return error instanceof AppError
    ? error
    : new AppError(
        "Could not process this question. Check the manual and server configuration, then try again.",
      );
}
