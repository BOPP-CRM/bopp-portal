import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getDialogVersion } from "@/components/util/dialog";
import apiClient from "@/services/api-client";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const TRACE_REFERENCE = `(รหัสอ้างอิง: ${TRACE_ID})`;

const originalAdapter = apiClient.client.defaults.adapter;
const originalConsoleError = console.error;

function useAdapter(adapter: AxiosAdapter) {
  apiClient.client.defaults.adapter = adapter;
}

function errorResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
  headers: Record<string, string>,
) {
  const response = {
    data,
    status,
    statusText: "Error",
    headers,
    config,
  } as AxiosResponse;

  return new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    response,
  );
}

describe("api client trace id", () => {
  const consoleErrors: unknown[][] = [];

  afterEach(() => {
    apiClient.client.defaults.adapter = originalAdapter;
    console.error = originalConsoleError;
    consoleErrors.length = 0;
  });

  function captureConsole() {
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args);
    };
  }

  it("rejects failed responses with the trace id and logs it", async () => {
    captureConsole();
    useAdapter(async (config) => {
      throw errorResponse(config, 500, { message: "เซิร์ฟเวอร์มีปัญหา" }, {
        "X-Trace-Id": TRACE_ID,
      });
    });

    await assert.rejects(
      () => apiClient.client.get("/portal/dashboard"),
      (error: unknown) => {
        assert.equal((error as { traceId?: string }).traceId, TRACE_ID);
        assert.equal(
          (error as { message: string }).message,
          `เซิร์ฟเวอร์มีปัญหา ${TRACE_REFERENCE}`,
        );
        assert.equal((error as { status?: number }).status, 500);
        return true;
      },
    );

    assert.equal(consoleErrors.length, 1);
    assert.match(String(consoleErrors[0][0]), new RegExp(TRACE_ID));
    assert.equal(axios.isAxiosError(consoleErrors[0][1]), true);
  });

  it("reads a lowercase header on a network error that includes a response", async () => {
    captureConsole();
    useAdapter(async (config) => {
      const response = {
        data: { error: "เชื่อมต่อไม่สำเร็จ" },
        status: 0,
        statusText: "",
        headers: { "x-trace-id": TRACE_ID },
        config,
      } as AxiosResponse;
      throw new AxiosError(
        "Network Error",
        AxiosError.ERR_NETWORK,
        config,
        undefined,
        response,
      );
    });

    await assert.rejects(
      () => apiClient.client.get("/portal/members"),
      (error: unknown) => {
        assert.equal((error as { traceId?: string }).traceId, TRACE_ID);
        assert.equal(
          (error as { message: string }).message,
          `เชื่อมต่อไม่สำเร็จ ${TRACE_REFERENCE}`,
        );
        return true;
      },
    );

    assert.equal(consoleErrors.length, 1);
  });

  it("keeps today's message and does not log when the header is missing", async () => {
    captureConsole();
    useAdapter(async (config) => {
      throw errorResponse(config, 500, { message: "เซิร์ฟเวอร์มีปัญหา" }, {});
    });

    await assert.rejects(
      () => apiClient.client.get("/portal/dashboard"),
      (error: unknown) => {
        assert.equal((error as { message: string }).message, "เซิร์ฟเวอร์มีปัญหา");
        assert.equal((error as { traceId?: string }).traceId, undefined);
        return true;
      },
    );

    assert.equal(consoleErrors.length, 0);
  });

  it("does not change successful responses that include the header", async () => {
    captureConsole();
    useAdapter(async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders({ "X-Trace-Id": TRACE_ID }),
      config,
    }));

    const response = await apiClient.client.get("/portal/dashboard");

    assert.deepEqual(response.data, { ok: true });
    assert.equal(response.status, 200);
    assert.equal(consoleErrors.length, 0);
  });

  it("still attaches the trace id when the error alert is skipped", async () => {
    captureConsole();
    const version = getDialogVersion();
    useAdapter(async (config) => {
      throw errorResponse(config, 400, { message: "ข้อมูลไม่ถูกต้อง" }, {
        "X-Trace-Id": TRACE_ID,
      });
    });

    await assert.rejects(
      () =>
        apiClient.client.post(
          "/portal/login",
          {},
          { skipErrorAlert: true },
        ),
      (error: unknown) => {
        assert.equal(
          (error as { message: string }).message,
          `ข้อมูลไม่ถูกต้อง ${TRACE_REFERENCE}`,
        );
        return true;
      },
    );

    assert.equal(getDialogVersion(), version);
    assert.equal(consoleErrors.length, 1);
  });

  it("does not open a dialog for silent auth requests", async () => {
    captureConsole();
    const version = getDialogVersion();
    useAdapter(async (config) => {
      throw errorResponse(config, 500, { message: "เซิร์ฟเวอร์มีปัญหา" }, {
        "X-Trace-Id": TRACE_ID,
      });
    });

    await assert.rejects(() => apiClient.client.get("/portal/me"));

    assert.equal(getDialogVersion(), version);
    assert.equal(consoleErrors.length, 1);
  });
});
