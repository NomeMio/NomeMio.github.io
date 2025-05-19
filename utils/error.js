export class CustomError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.name = "CustomError"; // Give the error a specific name
    this.errorCode = errorCode; // Add a custom error code property
  }
}

export const ErrorCodes = Object.freeze({
  ARG_ALREADY_EXISTS:   { type: "redundant", code: 123 },
  FOLDER_HAS_PARENT:   { type: "redundant", code: 124 }
});
