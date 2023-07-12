import {createCompletion} from '../../openai';
import type {Input, Output} from './types';
import {completionPayload} from './completion-payload';

export async function expenseSplitter(input: Input): Promise<Output> {
  const result = await createCompletion(completionPayload(input));

  const functionCallArguments = JSON.parse(
    result.choices[0].message.function_call.arguments,
  ).cost as Output;

  return functionCallArguments;
}
