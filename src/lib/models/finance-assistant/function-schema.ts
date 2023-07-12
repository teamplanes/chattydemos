import {JSONSchema} from 'json-schema-to-ts';

const outputSchema = {
  type: 'object',
  properties: {
    query: {
      description: 'The SQL SELECT query to run.',
      type: 'string',
    },
  },
  required: ['query'],
} as const satisfies JSONSchema;

export const functionSchema = {
  name: 'run_sql_select_query',
  description: 'Run an SQL query on the database of financial transactions.',
  parameters: outputSchema,
} as const;
