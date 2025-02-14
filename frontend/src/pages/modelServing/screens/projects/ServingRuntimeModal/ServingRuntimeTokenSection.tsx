import * as React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormGroup,
  FormSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import IndentSection from '~/pages/projects/components/IndentSection';
import { UpdateObjectAtPropAndValue } from '~/pages/projects/types';
import { CreatingServingRuntimeObject } from '~/pages/modelServing/screens/types';
import ServingRuntimeTokenInput from './ServingRuntimeTokenInput';

type ServingRuntimeTokenSectionProps = {
  data: CreatingServingRuntimeObject;
  setData: UpdateObjectAtPropAndValue<CreatingServingRuntimeObject>;
  allowCreate: boolean;
  createNewToken: () => void;
};

const ServingRuntimeTokenSection: React.FC<ServingRuntimeTokenSectionProps> = ({
  data,
  setData,
  allowCreate,
  createNewToken,
}) => (
  <FormSection title="Token authorization">
    <FormGroup>
      <Checkbox
        label="Require token authentication"
        id="alt-form-checkbox-auth"
        name="alt-form-checkbox-auth"
        isDisabled={!allowCreate}
        isChecked={data.tokenAuth}
        onChange={(e, check) => {
          setData('tokenAuth', check);
          if (data.tokens.length === 0) {
            createNewToken();
          }
        }}
      />
    </FormGroup>
    {data.tokenAuth && (
      <IndentSection>
        <Stack hasGutter>
          {allowCreate && (
            <StackItem>
              <Alert
                variant="info"
                isInline
                title="The actual tokens will be created and displayed when the model server is configured."
              />
            </StackItem>
          )}
          {data.tokens.map((token) => (
            <StackItem key={token.uuid}>
              <ServingRuntimeTokenInput
                token={token}
                data={data}
                setData={setData}
                disabled={!allowCreate}
              />
            </StackItem>
          ))}
          <StackItem>
            <Button
              onClick={() => {
                createNewToken();
              }}
              isInline
              iconPosition="left"
              variant="link"
              icon={<PlusCircleIcon />}
              isDisabled={!allowCreate}
            >
              Add a service account
            </Button>
          </StackItem>
        </Stack>
      </IndentSection>
    )}
  </FormSection>
);

export default ServingRuntimeTokenSection;
