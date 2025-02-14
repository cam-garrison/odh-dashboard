import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import ManageInferenceServiceModal from '~/pages/modelServing/screens/projects/InferenceServiceModal/ManageInferenceServiceModal';
import { ModelServingContext } from '~/pages/modelServing/ModelServingContext';
import {
  getSortedTemplates,
  getTemplateEnabled,
  getTemplateEnabledForPlatform,
} from '~/pages/modelServing/customServingRuntimes/utils';
import { ServingRuntimePlatform } from '~/types';
import { getProjectModelServingPlatform } from '~/pages/modelServing/screens/projects/utils';
import ManageKServeModal from '~/pages/modelServing/screens/projects/kServeModal/ManageKServeModal';
import { byName, ProjectsContext } from '~/concepts/projects/ProjectsContext';
import useServingPlatformStatuses from '~/pages/modelServing/useServingPlatformStatuses';

const ServeModelButton: React.FC = () => {
  const [platformSelected, setPlatformSelected] = React.useState<
    ServingRuntimePlatform | undefined
  >(undefined);
  const {
    inferenceServices: { refresh: refreshInferenceServices },
    servingRuntimes: { refresh: refreshServingRuntimes },
    servingRuntimeTemplates: { data: templates },
    servingRuntimeTemplateOrder: { data: templateOrder },
    servingRuntimeTemplateDisablement: { data: templateDisablement },
    dataConnections: { data: dataConnections },
  } = React.useContext(ModelServingContext);
  const { projects, refresh: refreshProjects } = React.useContext(ProjectsContext);
  const { namespace } = useParams<{ namespace: string }>();
  const servingPlatformStatuses = useServingPlatformStatuses();

  const project = projects.find(byName(namespace));

  const templatesSorted = getSortedTemplates(templates, templateOrder);
  const templatesEnabled = templatesSorted.filter((template) =>
    getTemplateEnabled(template, templateDisablement),
  );

  const onSubmit = (submit: boolean) => {
    if (submit) {
      refreshProjects();
      refreshInferenceServices();
      refreshServingRuntimes();
    }
    setPlatformSelected(undefined);
  };

  const deployButton = (
    <Button
      variant="primary"
      onClick={() =>
        project &&
        setPlatformSelected(
          getProjectModelServingPlatform(project, servingPlatformStatuses).platform,
        )
      }
      isAriaDisabled={!project || !templatesEnabled}
    >
      Deploy model
    </Button>
  );

  return (
    <>
      {!project ? (
        <Tooltip content="To deploy a model, select a project.">{deployButton}</Tooltip>
      ) : (
        deployButton
      )}
      {project && (
        <>
          <ManageInferenceServiceModal
            isOpen={platformSelected === ServingRuntimePlatform.MULTI}
            projectContext={{
              currentProject: project,
              dataConnections,
            }}
            onClose={(submit: boolean) => {
              onSubmit(submit);
            }}
          />
          <ManageKServeModal
            isOpen={platformSelected === ServingRuntimePlatform.SINGLE}
            projectContext={{
              currentProject: project,
              dataConnections,
            }}
            servingRuntimeTemplates={templatesEnabled.filter((template) =>
              getTemplateEnabledForPlatform(template, ServingRuntimePlatform.SINGLE),
            )}
            onClose={(submit: boolean) => {
              onSubmit(submit);
            }}
          />
        </>
      )}
    </>
  );
};

export default ServeModelButton;
