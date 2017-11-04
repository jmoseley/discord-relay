import { NextFunction, Request, Response } from 'express';
import * as winston from 'winston';

const DEFAULT_CODE   = 'unknown';
const DEFAULT_STATUS = 500;

export function reportErrorsMiddleware(
  error: any,
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const payload = _processError(error, request, response);
    if (!response.headersSent) {
        response.status(error.status).json({error: payload});
    }
  } catch (handlerError) {
    winston.error(`Error handler failed when handling error:`, error, handlerError);
    next(handlerError);
  }
}

/**
 * Logs the error for posterity.
 */
function _printError(error: any, request: Request, response: Response): void {
  const prefix = response.headersSent ? `Post-response error` : `Error`;
  const requestInfo = `${request.method} ${request.originalUrl}`;
  const stack = error.stack;

  winston.error(`${prefix} for ${requestInfo}:\n${error.message || error}\n${stack}`);
}

/**
 * Walks through an error, reports it to Sentry and converts it into JSON.
 *
 * This also recursively walks nested errors.
 */
function _processError(error: any, request: Request, response: Response) {
  _printError(error, request, response);

  return {
    code: error.errorCode || DEFAULT_CODE,
    details: {
      ...error.details,
      isPostResponse: !!response.headersSent,
      userReadableMessage: !!error.userReadableMessage,
    },
    message: error.message,
    status: error.status, // For the truly lazy.
    // TODO: Trace IDs
  };
}
