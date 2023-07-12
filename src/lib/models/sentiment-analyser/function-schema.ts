import {JSONSchema} from 'json-schema-to-ts';

const outputSchema = {
  type: 'object',
  properties: {
    sentiment: {
      description: 'The sentiment of the input text.',
      enum: ['positive', 'neutral', 'negative'],
    },
  },
  required: ['sentiment'],
} as const satisfies JSONSchema;

export const functionSchema = {
  name: 'output_sentiment',
  description: 'Output the sentiment of the input text.',
  parameters: outputSchema,
} as const;
