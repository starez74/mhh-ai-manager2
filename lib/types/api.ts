export type ApiError = {
  error: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;
