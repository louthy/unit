import { Field } from '../../../../../Class/Field'
import { System } from '../../../../../system'
import { ID_TEXT_AREA } from '../../../../_ids'

export interface I {
  style: object
}

export interface O {
  value: string
}

export default class TextArea extends Field<I, O> {
  constructor(system: System) {
    super(
      {
        i: ['value', 'style', 'placeholder'],
        o: ['value'],
      },
      {},
      system,
      ID_TEXT_AREA
    )

    this._defaultState = {
      value: '',
      placeholder: '',
    }
  }
}
