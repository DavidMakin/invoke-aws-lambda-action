import { InvocationRequest, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { getInput, setOutput, setFailed } from '@actions/core';

export enum ExtraOptions {
  HTTP_TIMEOUT = 'HTTP_TIMEOUT',
  MAX_RETRIES = 'MAX_RETRIES',
  SUCCEED_ON_FUNCTION_FAILURE = 'SUCCEED_ON_FUNCTION_FAILURE',
}

export enum Credentials {
  AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
  AWS_SESSION_TOKEN = 'AWS_SESSION_TOKEN',
}

export enum Props {
  FunctionName = 'FunctionName',
  InvocationType = 'InvocationType',
  LogType = 'LogType',
  ClientContext = 'ClientContext',
  Payload = 'Payload',
  Qualifier = 'Qualifier',
}

const getParams = () => {
  return Object.keys(Props).reduce((memo, prop) => {
    const value = getInput(prop);
    return value ? { ...memo, [prop]: value } : memo;
  }, {} as InvocationRequest);
};

export const main = async () => {
  try {
    const client = new LambdaClient({
      region: getInput('REGION') || 'us-east-1',
      maxAttempts: parseInt(getInput(ExtraOptions.MAX_RETRIES), 10),
    });

    const params = getParams();

    const command = new InvokeCommand(params);
    const response = await client.send(command);

    setOutput('response', response);

    const succeedOnFailure = getInput(ExtraOptions.SUCCEED_ON_FUNCTION_FAILURE).toLowerCase() === 'true';
    if ('FunctionError' in response && !succeedOnFailure) {
      throw new Error('Lambda invocation failed! See outputs.response for more information.');
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : JSON.stringify(error));
  }
};
