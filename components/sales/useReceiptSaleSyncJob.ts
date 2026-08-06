"use client";

import {
  getReceiptSaleSyncJob,
  getActiveReceiptSaleSyncJob,
} from "@/services/sales/sales";
import type { ReceiptSaleSyncJob } from "@/services/sales/types";
import { handleError } from "@/utils/errors";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 2500;

export function useReceiptSaleSyncJob(onComplete?: () => void) {
  const [job, setJob] = useState<ReceiptSaleSyncJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const completedJobIdRef = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const refreshJob = useCallback(async (jobId?: number) => {
    setError(null);
    try {
      if (jobId) {
        const response = await getReceiptSaleSyncJob(jobId);
        setJob(response.job);
        return response.job;
      }

      const response = await getActiveReceiptSaleSyncJob();
      const activeJob = response.job || null;
      setJob(activeJob);
      return activeJob;
    } catch (loadError) {
      const appError = handleError(loadError);
      if (appError.status === 404) {
        setJob(null);
        return null;
      }
      setError(appError.message);
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshJob();
  }, [refreshJob]);

  useEffect(() => {
    if (!job || (job.state !== "pending" && job.state !== "running")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshJob(job.id);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [job, refreshJob]);

  useEffect(() => {
    if (!job || job.state === "pending" || job.state === "running") {
      return;
    }
    if (completedJobIdRef.current === job.id) {
      return;
    }
    completedJobIdRef.current = job.id;
    onCompleteRef.current?.();
  }, [job?.state, job?.id]);

  const isActive = job?.state === "pending" || job?.state === "running";

  return {
    job,
    isActive,
    error,
    setJob,
    refreshJob,
  };
}

export function getReceiptSaleSyncProgress(job: ReceiptSaleSyncJob) {
  if (job.total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((job.processed / job.total) * 100));
}
