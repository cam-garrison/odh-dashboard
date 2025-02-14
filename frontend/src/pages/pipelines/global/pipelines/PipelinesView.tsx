import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import GlobalNoPipelines from '~/pages/pipelines/global/pipelines/GlobalNoPipelines';
import PipelinesTable from '~/concepts/pipelines/content/tables/pipeline/PipelinesTable';
import EmptyStateErrorMessage from '~/components/EmptyStateErrorMessage';
import usePipelinesTable from '~/concepts/pipelines/content/tables/pipeline/usePipelinesTable';
import GlobalPipelinesTableToolbar from '~/pages/pipelines/global/pipelines/GlobalPipelinesTableToolbar';
import usePipelineFilter from '~/concepts/pipelines/content/tables/usePipelineFilter';
import DashboardEmptyTableView from '~/concepts/dashboard/DashboardEmptyTableView';
import {
  getTablePagingProps,
  getTableSortProps,
} from '~/concepts/pipelines/content/tables/usePipelineTable';

const PipelinesView: React.FC = () => {
  const [
    [{ items: pipelines, totalSize }, loaded, loadError, refresh],
    { initialLoaded, ...tableProps },
  ] = usePipelinesTable();
  const filterToolbarProps = usePipelineFilter(tableProps.setFilter);
  const pagingProps = getTablePagingProps(tableProps);
  const sortProps = getTableSortProps(tableProps);

  if (loadError) {
    return (
      <EmptyStateErrorMessage title="Error displaying pipelines" bodyText={loadError.message} />
    );
  }

  if (!loaded && !initialLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (loaded && totalSize === 0 && !tableProps.filter) {
    return <GlobalNoPipelines />;
  }

  return (
    <PipelinesTable
      {...sortProps}
      {...pagingProps}
      totalSize={totalSize}
      loading={!loaded}
      pipelines={pipelines}
      enablePagination="compact"
      refreshPipelines={refresh}
      pipelineDetailsPath={(namespace, id) => `/pipelines/${namespace}/pipeline/view/${id}`}
      toolbarContent={<GlobalPipelinesTableToolbar {...filterToolbarProps} />}
      emptyTableView={
        <DashboardEmptyTableView onClearFilters={filterToolbarProps.onClearFilters} />
      }
    />
  );
};

export default PipelinesView;
