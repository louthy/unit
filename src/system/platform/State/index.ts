import { Done } from '../../../Class/Functional/Done'
import { Semifunctional } from '../../../Class/Semifunctional'
import { SharedRef } from '../../../SharefRef'
import { System } from '../../../system'
import { V } from '../../../types/interface/V'
import { weakMerge } from '../../../types/weakMerge'
import { $wrap } from '../../../wrap'
import { wrapArray } from '../../../wrap/Array'
import { wrapObject } from '../../../wrap/Object'
import { wrapValue } from '../../../wrap/Value'
import { ID_STATE } from '../../_ids'

export function extractInterface(data: any): string {
  if (typeof data === 'object') {
    if (data === null) {
      return null
    }

    if (data instanceof Array) {
      return 'A'
    } else {
      return 'J'
    }
  }

  return null
}

export interface I<T> {
  init: T
  done: any
}

export interface O<T> {
  data: V<T>
}

export default class State<T> extends Semifunctional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        fi: ['init'],
        fo: ['data'],
        i: ['done'],
        o: [],
      },
      {
        output: {
          data: {
            ref: true,
          },
        },
      },
      system,
      ID_STATE
    )
  }

  f({ init }: I<T>, done: Done<O<T>>): void {
    const sharedRef: SharedRef<T> = { current: init }

    let api: any = wrapValue(sharedRef, this.__system)

    const _ = extractInterface(init)

    if (_) {
      switch (_) {
        case 'A':
          {
            api = weakMerge(
              api,
              wrapArray(sharedRef as SharedRef<any[]>, this.__system)
            )
          }
          break
        case 'J':
          {
            api = weakMerge(api, wrapObject(sharedRef, this.__system))
          }
          break
      }
    }

    const data = $wrap<V<T>>(this.__system, api, _ ? ['V', _] : ['V'])

    done({
      data,
    })
  }

  onIterDataInputData(name: string, data: any): void {
    // if (name === 'done') {
    this._backward('init')
    this._backward('done')
    // }
  }
}
