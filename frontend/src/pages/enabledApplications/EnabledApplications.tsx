import * as React from 'react';
import * as _ from 'lodash-es';
import { Gallery, PageSection } from '@patternfly/react-core';
import { useWatchComponents } from '~/utilities/useWatchComponents';
import { OdhApplication } from '~/types';
import ApplicationsPage from '~/pages/ApplicationsPage';
import OdhAppCard from '~/components/OdhAppCard';
import { fireTrackingEvent } from '~/utilities/segmentIOUtils';

const description = `Launch your enabled applications, view documentation, or get started with quick start instructions and tasks.`;

type EnabledApplicationsInnerProps = {
  loaded: boolean;
  loadError?: Error;
  components: OdhApplication[];
};

// use to record the current enabled components
let enabledComponents: OdhApplication[] = [];

export const EnabledApplicationsInner: React.FC<EnabledApplicationsInnerProps> = React.memo(
  ({ loaded, loadError, components }) => {
    const isEmpty = components.length === 0;

    return (
      <ApplicationsPage
        title="Enabled"
        description={description}
        loaded={loaded}
        empty={isEmpty}
        loadError={loadError}
      >
        <PageSection isFilled data-id="page-content">
          <Gallery maxWidths={{ default: '330px' }} role="list" hasGutter>
            {components.map((c) => (
              <OdhAppCard key={c.metadata.name} odhApp={c} />
            ))}
          </Gallery>
        </PageSection>
      </ApplicationsPage>
    );
  },
);
EnabledApplicationsInner.displayName = 'EnabledApplicationsInner';

const EnabledApplications: React.FC = () => {
  const { components, loaded, loadError } = useWatchComponents(true);

  const sortedComponents = React.useMemo(
    () =>
      _.cloneDeep(components).sort((a, b) => a.spec.displayName.localeCompare(b.spec.displayName)),
    [components],
  );

  React.useEffect(() => {
    /*
     * compare the current enabled applications and new fetched enabled applications
     * fire an individual segment.io tracking event for every different enabled application
     */
    if (loaded && components.length) {
      _.difference(
        components.filter((component) => component.spec.isEnabled).map((c) => c.metadata.name),
        enabledComponents
          .filter((component) => component.spec.isEnabled)
          .map((c) => c.metadata.name),
      ).forEach((name) =>
        fireTrackingEvent('Application Enabled', {
          name,
        }),
      );
      enabledComponents = components;
    }
  }, [components, loaded]);

  return (
    <EnabledApplicationsInner loaded={loaded} components={sortedComponents} loadError={loadError} />
  );
};

export default EnabledApplications;
