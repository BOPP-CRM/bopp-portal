import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { closeDialog, getDialogState } from "@/components/util/dialog";
import { handleError, readTraceId, showErrorAlert } from "@/utils/errors";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const TRACE_REFERENCE = `(รหัสอ้างอิง: ${TRACE_ID})`;

function axiosError({
  status,
  data,
  headers,
  code,
  response = true,
}: {
  status?: number;
  data?: unknown;
  headers?: unknown;
  code?: string;
  response?: boolean;
}) {
  const config = {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
  const responseBody = response
    ? ({
        data,
        status: status ?? 0,
        statusText: "Error",
        headers: headers ?? {},
        config,
      } as AxiosResponse)
    : undefined;

  return new AxiosError(
    "Request failed",
    code ?? (response ? "ERR_BAD_RESPONSE" : "ERR_NETWORK"),
    config,
    undefined,
    responseBody,
  );
}

describe("readTraceId", () => {
  it("reads the header case-insensitively", () => {
    assert.equal(readTraceId({ "X-Trace-Id": TRACE_ID }), TRACE_ID);
    assert.equal(readTraceId({ "x-trace-id": TRACE_ID }), TRACE_ID);
    assert.equal(readTraceId({ "X-TRACE-ID": `  ${TRACE_ID}  ` }), TRACE_ID);

    const headers = new AxiosHeaders();
    headers.set("X-Trace-Id", TRACE_ID);
    assert.equal(readTraceId(headers), TRACE_ID);

    const fetchHeaders = new Headers();
    fetchHeaders.set("X-Trace-Id", TRACE_ID);
    assert.equal(readTraceId(fetchHeaders), TRACE_ID);
  });

  it("accepts the first valid id when the header has multiple values", () => {
    assert.equal(
      readTraceId({ "X-Trace-Id": ["not-a-trace", TRACE_ID] }),
      TRACE_ID,
    );
  });

  it("ignores missing and malformed values", () => {
    assert.equal(readTraceId(undefined), undefined);
    assert.equal(readTraceId(null), undefined);
    assert.equal(readTraceId({}), undefined);
    assert.equal(readTraceId({ "X-Trace-Id": "" }), undefined);
    assert.equal(readTraceId({ "X-Trace-Id": "   " }), undefined);
    assert.equal(readTraceId({ "X-Trace-Id": "not-a-trace" }), undefined);
    assert.equal(readTraceId({ "X-Trace-Id": `${TRACE_ID}ff` }), undefined);
    assert.equal(readTraceId({ "X-Trace-Id": TRACE_ID.slice(0, 31) }), undefined);
    assert.equal(readTraceId({ "X-Request-Id": TRACE_ID }), undefined);
  });
});

describe("handleError", () => {
  it("appends the trace id to an HTTP error message", () => {
    const error = handleError(
      axiosError({
        status: 400,
        data: { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );

    assert.equal(error.status, 400);
    assert.equal(error.traceId, TRACE_ID);
    assert.equal(
      error.message,
      `อีเมลหรือรหัสผ่านไม่ถูกต้อง ${TRACE_REFERENCE}`,
    );
  });

  it("uses an error payload and a lowercase header", () => {
    const error = handleError(
      axiosError({
        status: 422,
        data: { error: "ไม่สามารถทำรายการได้" },
        headers: { "x-trace-id": TRACE_ID },
      }),
    );

    assert.equal(error.traceId, TRACE_ID);
    assert.equal(error.message, `ไม่สามารถทำรายการได้ ${TRACE_REFERENCE}`);
  });

  it("keeps a string error payload and adds the reference", () => {
    const error = handleError(
      axiosError({
        status: 400,
        data: "บันทึกไม่สำเร็จ",
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );

    assert.equal(error.message, `บันทึกไม่สำเร็จ ${TRACE_REFERENCE}`);
  });

  it("adds the reference to server and timeout fallbacks when a response exists", () => {
    const server = handleError(
      axiosError({
        status: 500,
        data: "<html><body>bad gateway</body></html>",
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );
    assert.equal(
      server.message,
      `เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง ${TRACE_REFERENCE}`,
    );

    const timeout = handleError(
      axiosError({
        status: 504,
        code: "ECONNABORTED",
        headers: new AxiosHeaders({ "X-Trace-Id": TRACE_ID }),
      }),
    );
    assert.equal(timeout.traceId, TRACE_ID);
    assert.equal(
      timeout.message,
      `Request timed out. Please try again. ${TRACE_REFERENCE}`,
    );
  });

  it("adds the reference for a network error that still has a response", () => {
    const error = handleError(
      axiosError({
        code: "ERR_NETWORK",
        data: { message: "upstream failed" },
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );

    assert.equal(error.traceId, TRACE_ID);
    assert.equal(error.message, `upstream failed ${TRACE_REFERENCE}`);
  });

  it("leaves messages unchanged when the header is missing or invalid", () => {
    const missing = handleError(
      axiosError({
        status: 500,
        data: { message: "เซิร์ฟเวอร์มีปัญหา" },
      }),
    );
    assert.equal(missing.message, "เซิร์ฟเวอร์มีปัญหา");
    assert.equal(missing.traceId, undefined);

    const invalid = handleError(
      axiosError({
        status: 500,
        headers: { "X-Trace-Id": "nope" },
      }),
    );
    assert.equal(invalid.message, "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง");
    assert.equal(invalid.traceId, undefined);

    const network = handleError(
      axiosError({ response: false, code: "ERR_NETWORK" }),
    );
    assert.equal(network.message, "Network error. Please check your connection.");
    assert.equal(network.traceId, undefined);
  });

  it("does not append the reference twice", () => {
    const once = handleError(
      axiosError({
        status: 500,
        data: { message: "ล้มเหลว" },
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );
    const twice = handleError(once);

    assert.equal(twice, once);
    assert.equal(twice.message, `ล้มเหลว ${TRACE_REFERENCE}`);
  });

  it("leaves non-axios errors unchanged", () => {
    assert.equal(handleError(new Error("boom")).message, "boom");
    assert.equal(
      handleError("nope").message,
      "An unexpected error occurred.",
    );
  });
});

describe("showErrorAlert", () => {
  afterEach(() => {
    closeDialog(true);
  });

  it("puts the trace id in the dialog title and keeps the original description", async () => {
    await showErrorAlert(
      axiosError({
        status: 500,
        data: { message: "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง" },
        headers: { "X-Trace-Id": TRACE_ID },
      }),
    );

    const state = getDialogState();
    assert.ok(state);
    assert.equal(state.options.title, `เกิดข้อผิดพลาด ${TRACE_REFERENCE}`);
    assert.equal(
      state.options.description,
      "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง",
    );
    assert.equal(state.options.traceId, TRACE_ID);
    assert.equal(state.options.confirmText, "ตกลง");
    assert.equal(state.options.showCancel, false);
  });

  it("matches the previous dialog when no trace id is present", async () => {
    await showErrorAlert(
      axiosError({
        status: 400,
        data: { message: "ข้อมูลไม่ถูกต้อง" },
      }),
    );

    const state = getDialogState();
    assert.ok(state);
    assert.equal(state.options.title, "เกิดข้อผิดพลาด");
    assert.equal(state.options.description, "ข้อมูลไม่ถูกต้อง");
    assert.equal(state.options.traceId, undefined);
  });
});
