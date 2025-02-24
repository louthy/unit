import { Functional } from '../../../../Class/Functional'
import { Done } from '../../../../Class/Functional/Done'
import { getSpec } from '../../../../client/spec'
import { cloneUnitBundle } from '../../../../cloneUnitClass'
import { stringify } from '../../../../spec/stringify'
import { System } from '../../../../system'
import { UnitBundle } from '../../../../types/UnitBundle'
import { weakMerge } from '../../../../types/weakMerge'
import { ID_SET_INPUT } from '../../../_ids'

export interface I<T> {
  unit: UnitBundle
  name: string
  data: any
}

export interface O<T> {
  unit: UnitBundle
}

export default class SetInput<T> extends Functional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        i: ['unit', 'name', 'data'],
        o: ['unit'],
      },
      {},
      system,
      ID_SET_INPUT
    )
  }

  f({ unit, name, data }: I<T>, done: Done<O<T>>): void {
    const { id } = unit.__bundle.unit

    const spec = getSpec(
      weakMerge(this.__system.specs, unit.__bundle.specs ?? {}),
      id
    )

    const { inputs = {} } = spec

    if (!inputs[name]) {
      done(undefined, 'input not found')

      return
    }

    const NewBundle: UnitBundle = cloneUnitBundle(unit)

    NewBundle.__bundle.unit.input = NewBundle.__bundle.unit.input || {}
    NewBundle.__bundle.unit.input[name] =
      NewBundle.__bundle.unit.input[name] || {}
    NewBundle.__bundle.unit.input[name].data = stringify(data) // AD HOC

    done({ unit: NewBundle })
  }
}
