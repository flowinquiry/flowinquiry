import { signOut } from "next-auth/react";

import { auth } from "@/auth";
import { getAccessToken } from "@/lib/access-token-manager";
import { BACK_END_URL, BASE_URL } from "@/lib/constants";
import { handleError, HttpError } from "@/lib/errors";
import { PageableResult } from "@/types/commons";
import {
  createQueryParams,
  Pagination,
  paginationSchema,
  QueryDTO,
  querySchema,
} from "@/types/query";

export const getSecureBlobResource = async (
  url: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  const token = getAccessToken();

  try {
    const response = await fetch(`${BASE_URL}/api/files/${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      return response.blob();
    } else {
      throw new Error("Error retrieving file");
    }
  } catch (error: any) {
    console.error(`Error to get resource ${url}`);
  }
};

export const fetchData = async <TData, TResponse>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  data?: TData,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const tokenProvider = determineTokenProvider(securityMode);
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data instanceof FormData) {
    options.body = data;
  } else if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    const apiUrl =
      securityMode === SecurityMode.CLIENT_SECURE ||
      securityMode === SecurityMode.NOT_SECURE
        ? BASE_URL
        : BACK_END_URL;
    const response = await fetch(`${apiUrl}${url}`, options);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as TResponse;
      } else {
        return undefined as unknown as TResponse;
      }
    } else {
      if (
        response.status === 401 &&
        securityMode === SecurityMode.CLIENT_SECURE
      ) {
        await signOut();
        return undefined as unknown as TResponse;
      }
      // Handle error and return a meaningful error object
      const error = await handleError(response, url);
      if (setError) {
        setError(error); // Only set error here
      }

      throw error; // Re-throw to propagate the error
    }
  } catch (error: any) {
    console.log(`Error ${error}`);
    // Only handle network-related errors here
    if (!error.handled && setError) {
      setError(`There was a network issue ${error}. Please try again.`);
    }
    throw error; // Always re-throw for further handling
  }
};

export const getClientToken = async (): Promise<string | undefined> => {
  return getAccessToken();
};

export const getServerToken = async (): Promise<string | undefined> => {
  const session = await auth();
  return session?.user?.accessToken;
};

export const get = async <TResponse>(
  url: string,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  return fetchData(url, "GET", undefined, setError, securityMode);
};

export const post = async <TData, TResponse>(
  url: string,
  data?: TData,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  return fetchData(url, "POST", data, setError, securityMode);
};

export const put = async <TData, TResponse>(
  url: string,
  data?: TData,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  return fetchData(url, "PUT", data, setError, securityMode);
};

export const patch = async <TData, TResponse>(
  url: string,
  data?: TData,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  return fetchData(url, "PATCH", data, setError, securityMode);
};

export const deleteExec = async <TData, TResponse>(
  url: string,
  data?: TData,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
): Promise<TResponse> => {
  return fetchData(url, "DELETE", data, setError, securityMode);
};

// Default pagination object
const defaultPagination: Pagination = {
  page: 1,
  size: 10,
};

const determineTokenProvider = (
  securityMode: SecurityMode,
): (() => Promise<string | undefined>) | undefined => {
  switch (securityMode) {
    case SecurityMode.CLIENT_SECURE:
      return getClientToken;
    case SecurityMode.SERVER_SECURE:
      return getServerToken;
    case SecurityMode.NOT_SECURE:
      return undefined;
    default:
      throw new Error(`Unhandled SecurityMode: ${securityMode}`);
  }
};

// Function to send a dynamic search query with pagination and URL
export const doAdvanceSearch = async <R>(
  url: string, // URL is passed as a parameter
  query: QueryDTO = { filters: [] },
  pagination: Pagination = defaultPagination,
  setError?: (error: HttpError | string | null) => void,
  securityMode: SecurityMode = SecurityMode.CLIENT_SECURE,
) => {
  // Validate QueryDTO
  const queryValidation = querySchema.safeParse(query);
  if (!queryValidation.success) {
    throw new HttpError(
      HttpError.BAD_REQUEST,
      `Invalid query ${JSON.stringify(query)}. Root cause is ${JSON.stringify(queryValidation.error.issues)}`,
    );
  }

  // Validate pagination
  const paginationValidation = paginationSchema.safeParse(pagination);
  if (!paginationValidation.success) {
    throw new HttpError(
      HttpError.BAD_REQUEST,
      `Invalid pagination ${JSON.stringify(paginationValidation.error.issues)}`,
    );
  }

  const queryParams = createQueryParams(pagination);

  return fetchData<QueryDTO, PageableResult<R>>(
    `${url}?${queryParams.toString()}`,
    "POST",
    query,
    setError,
    securityMode,
  );
};

export enum SecurityMode {
  NOT_SECURE = "NOT_SECURE",
  CLIENT_SECURE = "CLIENT_SECURE",
  SERVER_SECURE = "SERVER_SECURE",
}
