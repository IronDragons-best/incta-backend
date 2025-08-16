import { AxiosResponse } from 'axios';
import { AppNotification, ErrorResponseDto } from '@common';

export function filesServiceErrorHandler(
  response: AxiosResponse<ErrorResponseDto>,
  notify: AppNotification,

  operation: string = 'uploading file',
): AppNotification {
  const { status, data } = response;

  const errorText = data.errorsMessages[0].message;
  const field = data.errorsMessages[0].field;

  if (status >= 500) {
    return notify.setServerError(errorText ?? `Something went wrong while ${operation}`);
  }

  if (status === 413) {
    return notify.setToLarge(errorText ?? 'File size exceeds the allowed limit', 'file');
  }

  if (status === 400) {
    return notify.setBadRequest(errorText ?? `Bad request during ${operation}`, field);
  }

  if (errorText) {
    return notify.setBadRequest(errorText);
  }

  return notify;
}
