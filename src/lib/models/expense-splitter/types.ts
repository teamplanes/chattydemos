import {FromSchema} from 'json-schema-to-ts';
import {functionSchema} from './function-schema';

export interface Input {
  expenseAsNaturalLanguage: string;
}

export type Output = FromSchema<(typeof functionSchema)['parameters']>['cost'];
