"use client";

import {
  getActiveZortoutSaleSyncJob,
  getZortoutSaleSyncJob,
} from "@/services/sales/sales";
import type { ZortoutSaleSyncJob } from "@/services/sales/types";
import { handleError } from "@/utils/errors";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 2000;

export function useZortoutSaleSyncJob(onComplete?: () => void) {
  const [job, setJob] = useState<ZortoutSaleSyncJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const completedJobIdRef = useRef<number | null>(null);
  const trackedJobIdRef = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const refreshJob = useCallback(async (jobId?: number) => {
    setError(null);
    try {
      const targetJobId = jobId ?? trackedJobIdRef.current ?? undefined;
      if (targetJobId) {
        const response = await getZortoutSaleSyncJob(targetJobId);
        setJob(response.job);
        trackedJobIdRef.current = response.job.id;
        return response.job;
      }

      const response = await getActiveZortoutSaleSyncJob();
      const activeJob = response.job || null;
      setJob(activeJob);
      trackedJobIdRef.current = activeJob?.id ?? null;
      return activeJob;
    } catch (loadError) {
      const appError = handleError(loadError);
      if (appError.status === 404) {
        setJob(null);
        trackedJobIdRef.current = null;
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

export function getZortoutSaleSyncProgress(job: ZortoutSaleSyncJob) {
  if (job.total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((job.processed / job.total) * 100));
}
