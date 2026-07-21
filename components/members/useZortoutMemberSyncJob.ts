"use client";

import {
  getActiveZortoutMemberSyncJob,
  getZortoutMemberSyncJob,
} from "@/services/zortout/zortout";
import type { ZortoutMemberSyncJob } from "@/services/zortout/types";
import { handleError } from "@/utils/errors";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 2000;

export function useZortoutMemberSyncJob(
  onComplete?: () => void,
  refreshKey = 0,
  initialJobId: number | null = null,
) {
  const [job, setJob] = useState<ZortoutMemberSyncJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const completedJobIdRef = useRef<number | null>(null);
  const trackedJobIdRef = useRef<number | null>(initialJobId);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (initialJobId) {
      trackedJobIdRef.current = initialJobId;
    }
  }, [initialJobId]);

  const refreshJob = useCallback(async (jobId?: number) => {
    setError(null);
    try {
      const targetJobId = jobId ?? trackedJobIdRef.current ?? undefined;
      if (targetJobId) {
        const response = await getZortoutMemberSyncJob(targetJobId);
        setJob(response.job);
        trackedJobIdRef.current = response.job.id;
        return response.job;
      }

      const response = await getActiveZortoutMemberSyncJob();
      const activeJob = response.job || null;
      setJob(activeJob);
      trackedJobIdRef.current = activeJob?.id ?? null;
      return activeJob;
    } catch (loadError) {
      setError(handleError(loadError).message);
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshJob(initialJobId ?? undefined);
  }, [refreshJob, refreshKey, initialJobId]);

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

export function getZortoutMemberSyncProgress(job: ZortoutMemberSyncJob) {
  if (job.total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((job.processed / job.total) * 100));
}
