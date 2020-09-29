/**
 * Copyright 2020 Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { observable, computed } from 'mobx';
import { EntityDiff } from 'SDLC/comparison/EntityDiff';
import { extractElementNameFromPath } from 'MetaModelUtility';
import { EntityChangeType } from 'SDLC/entity/EntityChange';
import { IllegalStateError, shallowStringify } from 'Utilities/GeneralUtil';
import { Entity } from './Entity';

export class EntityChangeConflictResolution {
  @observable entityPath: string;
  @observable resolvedEntity?: Entity;

  constructor(entityPath: string, resolvedEntity: Entity | undefined) {
    this.entityPath = entityPath;
    this.resolvedEntity = resolvedEntity;
  }
}

export class EntityChangeConflict {
  @observable entityPath: string;
  @observable incomingChangeEntityDiff: EntityDiff;
  @observable currentChangeEntityDiff: EntityDiff;

  constructor(entityPath: string, incomingChangeEntityDiff: EntityDiff, currentChangeEntityDiff: EntityDiff) {
    this.entityPath = entityPath;
    this.incomingChangeEntityDiff = incomingChangeEntityDiff;
    this.currentChangeEntityDiff = currentChangeEntityDiff;
  }

  @computed get entityName(): string { return extractElementNameFromPath(this.entityPath) }

  @computed get conflictReason(): string {
    if (this.incomingChangeEntityDiff.entityChangeType === EntityChangeType.CREATE && this.currentChangeEntityDiff.entityChangeType === EntityChangeType.CREATE) {
      return 'Entity is created in both incoming changes and current changes but the contents are different';
    } else if (this.incomingChangeEntityDiff.entityChangeType === EntityChangeType.MODIFY && this.currentChangeEntityDiff.entityChangeType === EntityChangeType.MODIFY) {
      return 'Entity is modified in both incoming changes and current changes but the contents are different';
    } else if (this.incomingChangeEntityDiff.entityChangeType === EntityChangeType.DELETE && this.currentChangeEntityDiff.entityChangeType === EntityChangeType.MODIFY) {
      return 'Entity is deleted in incoming changes but modified in current changes';
    } else if (this.incomingChangeEntityDiff.entityChangeType === EntityChangeType.MODIFY && this.currentChangeEntityDiff.entityChangeType === EntityChangeType.DELETE) {
      return 'Entity is modified in incoming changes but deleted in current changes';
    }
    throw new IllegalStateError(`Detected unfeasible state while computing entity change conflict for entity '${this.entityPath}', with current change: ${shallowStringify(this.currentChangeEntityDiff)}, and incoming change: ${shallowStringify(this.incomingChangeEntityDiff)}`);
  }
}