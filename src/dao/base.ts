import * as AWS from 'aws-sdk';

import createLogger from '../lib/logger';

const LOG = createLogger('BaseDAO');

export default abstract class BaseDAO<S extends ISchema> {
  constructor(
    protected readonly tableName: string,
    protected readonly dynamoDB: AWS.DynamoDB,
  ) {}

  public async createTable(): Promise<void> {
    LOG.info(`Creating table for ${this.constructor.name}.`);
    try {
      await this.dynamoDB.describeTable({
        TableName: this.tableName,
      }, undefined).promise();
    } catch (error) {
      LOG.error(error);
    }
    // await this.dynamoDB.createTable({
    //   Attr
    //   TableName: this.tableName,
    // }, undefined).promise();
  }
}

export interface ISchema {
  [key: string]: any;
}
