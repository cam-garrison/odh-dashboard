import * as React from 'react';
import {
  ContextResourceData,
  PrometheusQueryRangeResponseDataResult,
  PrometheusQueryRangeResultValue,
} from '~/types';
import {
  ModelMetricType,
  ServerMetricType,
} from '~/pages/modelServing/screens/metrics/ModelServingMetricsContext';
import {
  PerformanceMetricType,
  RefreshIntervalTitle,
  TimeframeTitle,
} from '~/pages/modelServing/screens/types';
import { ResponsePredicate } from '~/api/prometheus/usePrometheusQueryRange';
import useRefreshInterval from '~/utilities/useRefreshInterval';
import { RefreshIntervalValue } from '~/pages/modelServing/screens/const';
import { SupportedArea, useIsAreaAvailable } from '~/concepts/areas';
import { PROMETHEUS_BIAS_PATH } from '~/api/prometheus/const';
import useQueryRangeResourceData from './useQueryRangeResourceData';

export const useModelServingMetrics = (
  type: PerformanceMetricType,
  queries: { [key in ModelMetricType]: string } | { [key in ServerMetricType]: string },
  timeframe: TimeframeTitle,
  lastUpdateTime: number,
  setLastUpdateTime: (time: number) => void,
  refreshInterval: RefreshIntervalTitle,
  namespace: string,
): {
  data: Record<
    ServerMetricType | ModelMetricType,
    ContextResourceData<PrometheusQueryRangeResultValue | PrometheusQueryRangeResponseDataResult>
  >;
  refresh: () => void;
} => {
  const [end, setEnd] = React.useState(lastUpdateTime);
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
  const performanceMetricsAreaAvailable = useIsAreaAvailable(
    SupportedArea.PERFORMANCE_METRICS,
  ).status;

  const defaultResponsePredicate = React.useCallback<ResponsePredicate>(
    (data) => data.result?.[0]?.values || [],
    [],
  );

  const prometheusQueryRangeResponsePredicate = React.useCallback<
    ResponsePredicate<PrometheusQueryRangeResponseDataResult>
  >((data) => data.result || [], []);

  const serverRequestCount = useQueryRangeResourceData(
    performanceMetricsAreaAvailable && type === PerformanceMetricType.SERVER,
    (queries as { [key in ServerMetricType]: string })[ServerMetricType.REQUEST_COUNT],
    end,
    timeframe,
    defaultResponsePredicate,
    namespace,
  );

  const serverAverageResponseTime =
    useQueryRangeResourceData<PrometheusQueryRangeResponseDataResult>(
      performanceMetricsAreaAvailable && type === PerformanceMetricType.SERVER,
      (queries as { [key in ServerMetricType]: string })[ServerMetricType.AVG_RESPONSE_TIME],
      end,
      timeframe,
      prometheusQueryRangeResponsePredicate,
      namespace,
    );

  const serverCPUUtilization = useQueryRangeResourceData(
    performanceMetricsAreaAvailable && type === PerformanceMetricType.SERVER,
    (queries as { [key in ServerMetricType]: string })[ServerMetricType.CPU_UTILIZATION],
    end,
    timeframe,
    defaultResponsePredicate,
    namespace,
  );

  const serverMemoryUtilization = useQueryRangeResourceData(
    performanceMetricsAreaAvailable && type === PerformanceMetricType.SERVER,
    (queries as { [key in ServerMetricType]: string })[ServerMetricType.MEMORY_UTILIZATION],
    end,
    timeframe,
    defaultResponsePredicate,
    namespace,
  );

  const modelRequestSuccessCount = useQueryRangeResourceData(
    performanceMetricsAreaAvailable && type === PerformanceMetricType.MODEL,
    (queries as { [key in ModelMetricType]: string })[ModelMetricType.REQUEST_COUNT_SUCCESS],
    end,
    timeframe,
    defaultResponsePredicate,
    namespace,
  );

  const modelRequestFailedCount = useQueryRangeResourceData(
    performanceMetricsAreaAvailable && type === PerformanceMetricType.MODEL,
    (queries as { [key in ModelMetricType]: string })[ModelMetricType.REQUEST_COUNT_FAILED],
    end,
    timeframe,
    defaultResponsePredicate,
    namespace,
  );

  const modelTrustyAISPD = useQueryRangeResourceData(
    biasMetricsAreaAvailable && type === PerformanceMetricType.MODEL,
    (queries as { [key in ModelMetricType]: string })[ModelMetricType.TRUSTY_AI_SPD],
    end,
    timeframe,
    prometheusQueryRangeResponsePredicate,
    namespace,
    PROMETHEUS_BIAS_PATH,
  );

  const modelTrustyAIDIR = useQueryRangeResourceData(
    biasMetricsAreaAvailable && type === PerformanceMetricType.MODEL,
    (queries as { [key in ModelMetricType]: string })[ModelMetricType.TRUSTY_AI_DIR],
    end,
    timeframe,
    prometheusQueryRangeResponsePredicate,
    namespace,
    PROMETHEUS_BIAS_PATH,
  );

  React.useEffect(() => {
    setLastUpdateTime(Date.now());
    // re-compute lastUpdateTime when data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverRequestCount,
    serverAverageResponseTime,
    serverCPUUtilization,
    serverMemoryUtilization,
    modelRequestSuccessCount,
    modelRequestFailedCount,
    modelTrustyAIDIR,
    modelTrustyAISPD,
  ]);

  const refreshAllMetrics = React.useCallback(() => {
    setEnd(Date.now());
  }, []);

  useRefreshInterval(RefreshIntervalValue[refreshInterval], refreshAllMetrics);

  const result = React.useMemo(
    () => ({
      data: {
        [ServerMetricType.REQUEST_COUNT]: serverRequestCount,
        [ServerMetricType.AVG_RESPONSE_TIME]: serverAverageResponseTime,
        [ServerMetricType.CPU_UTILIZATION]: serverCPUUtilization,
        [ServerMetricType.MEMORY_UTILIZATION]: serverMemoryUtilization,
        [ModelMetricType.REQUEST_COUNT_SUCCESS]: modelRequestSuccessCount,
        [ModelMetricType.REQUEST_COUNT_FAILED]: modelRequestFailedCount,
        [ModelMetricType.TRUSTY_AI_SPD]: modelTrustyAISPD,
        [ModelMetricType.TRUSTY_AI_DIR]: modelTrustyAIDIR,
      },
      refresh: refreshAllMetrics,
    }),
    [
      serverRequestCount,
      serverAverageResponseTime,
      serverCPUUtilization,
      serverMemoryUtilization,
      modelRequestSuccessCount,
      modelRequestFailedCount,
      modelTrustyAIDIR,
      modelTrustyAISPD,
      refreshAllMetrics,
    ],
  );

  // store the result in a reference and only update the reference so long as there are no pending queries
  const resultRef = React.useRef(result);
  if (
    !(
      serverRequestCount.pending ||
      serverAverageResponseTime.pending ||
      serverCPUUtilization.pending ||
      serverMemoryUtilization.pending ||
      modelRequestSuccessCount.pending ||
      modelRequestFailedCount.pending ||
      modelTrustyAIDIR.pending ||
      modelTrustyAISPD.pending
    )
  ) {
    resultRef.current = result;
  }
  return resultRef.current;
};
