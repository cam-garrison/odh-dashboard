import * as React from 'react';
import { getServiceMeshGwHost, getRoute, getNotebook } from '~/api';
import { FAST_POLL_INTERVAL } from '~/utilities/const';
import { useAppContext } from '~/app/AppContext';
import { hasServiceMeshAnnotation } from './utils';

const useRouteForNotebook = (
  notebookName?: string,
  projectName?: string,
  isRunning?: boolean,
): [routeLink: string | null, loaded: boolean, loadError: Error | null] => {
  const [route, setRoute] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const { dashboardConfig } = useAppContext();

  React.useEffect(() => {
    let watchHandle;
    let cancelled = false;
    const watchRoute = async () => {
      if (cancelled) {
        return;
      }
      if (notebookName && projectName) {
        // fetch notebook to check if it was created with or without service mesh enabled.
        const notebookServiceMeshFlag = await hasServiceMeshAnnotation(notebookName, projectName);

        // if not using service mesh fetch openshift route, otherwise get Istio Ingress Gateway route
        const getRoutePromise = notebookServiceMeshFlag
          ? getRoute(notebookName, projectName).then((route) => route?.spec.host)
          : getServiceMeshGwHost(projectName);

        getRoutePromise
          .then((host) => {
            if (cancelled) {
              return;
            }
            setRoute(`https://${host}/notebook/${projectName}/${notebookName}/`);
            setLoadError(null);
            setLoaded(true);
          })
          .catch((e) => {
            if (cancelled) {
              return;
            }
            if (!isRunning && e.statusObject?.code === 404) {
              setLoadError(null);
            } else {
              setLoadError(e);
            }
            watchHandle = setTimeout(watchRoute, FAST_POLL_INTERVAL);
          });
      }
    };
    watchRoute();
    return () => {
      cancelled = true;
      clearTimeout(watchHandle);
    };
  }, [notebookName, projectName, isRunning, dashboardConfig]);

  return [route, loaded, loadError];
};

export default useRouteForNotebook;
