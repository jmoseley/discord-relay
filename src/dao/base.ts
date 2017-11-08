import * as AWS from 'aws-sdk';

import createLogger from '../lib/logger';

const LOG = createLogger('BaseDAO');

export default abstract class BaseDAO<S extends ISchema> {
  constructor(
    protected readonly tableName: string,
    protected readonly dynamoDB: AWS.DynamoDB,
    private partitionKey: string,
    private partitionKeyType: 'S' | 'N' | 'B',
    private sortKey?: string,
    private sortKeyType?: 'S' | 'N' | 'B',
  ) {}

  public async createTable(): Promise<void> {
    let tableExists = true;
    try {
      await this.dynamoDB.describeTable({
        TableName: this.tableName,
      }, undefined).promise();
    } catch (error) {
      if (error.code && error.code === 'ResourceNotFoundException') {
        tableExists = false;
      } else {
        throw error;
      }
    }
    if (!tableExists) {
      LOG.info(`Creating table for ${this.constructor.name}.`);
      const AttributeDefinitions = [{
        AttributeName: this.partitionKey,
        AttributeType: this.partitionKeyType,
      }];
      if (this.sortKey && this.sortKeyType) {
        AttributeDefinitions.push({
          AttributeName: this.sortKey,
          AttributeType: this.sortKeyType,
        });
      }
      const KeySchema = [{
        AttributeName: this.partitionKey,
        KeyType: 'HASH',
      }];
      if (this.sortKey && this.sortKeyType) {
        KeySchema.push({
          AttributeName: this.sortKey,
          KeyType: 'RANGE',
        });
      }
      // TODO: Type magic to build all the attribute defintions.
      await this.dynamoDB.createTable({
        AttributeDefinitions,
        KeySchema,
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        TableName: this.tableName,
      }, undefined).promise();
    }
  }
}

export interface ISchema {
  [key: string]: any;
}
