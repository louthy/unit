import { Functional } from '../../../../../Class/Functional'
import { Done } from '../../../../../Class/Functional/Done'
import { fromBundle } from '../../../../../spec/fromBundle'
import { System } from '../../../../../system'
import { BundleSpec } from '../../../../../types/BundleSpec'
import { GraphBundle } from '../../../../../types/GraphClass'
import { weakMerge } from '../../../../../types/weakMerge'
import { ID_FROM_BUNDLE } from '../../../../_ids'

export interface I {
  bundle: BundleSpec
}

export interface O {
  graph: GraphBundle
}

export default class FromBundle extends Functional<I, O> {
  constructor(system: System) {
    super(
      {
        i: ['bundle'],
        o: ['graph'],
      },
      {
        output: {},
      },
      system,
      ID_FROM_BUNDLE
    )
  }

  f({ bundle }: I, done: Done<O>): void {
    // console.log('FromBundle', 'f', bundle)

    try {
      const graph = fromBundle(
        bundle,
        weakMerge(bundle.specs ?? {}, this.__system.specs),
        {}
      )
      done({ graph })
    } catch (err) {
      // console.log(err)
    }
  }
}
