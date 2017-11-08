import * as _ from 'lodash';

import BaseDAO, { ISchema } from './base';

export class Migrator {
  private daos: Array<BaseDAO<ISchema>>;

  constructor(...args: Array<BaseDAO<ISchema>>) {
    this.daos = args;
  }

  public async createTables(): Promise<void> {
    await Promise.all(this.daos.map(async dao => {
      await dao.createTable();
    }));
  }
}
