import { getSpec, isSystemSpecId } from './client/spec'
import { GraphSpecs, GraphUnitSpec, Specs } from './types'
import { BundleSpec } from './types/BundleSpec'
import { GraphSpec } from './types/GraphSpec'
import { UnitBundleSpec } from './types/UnitBundleSpec'

export function unitBundleSpec(
  unit: GraphUnitSpec,
  specs: Specs
): UnitBundleSpec {
  const { id } = unit

  const spec = getSpec(specs, id)

  const { system } = spec

  if (system) {
    return {
      unit: {
        id,
        ...unit,
      },
    }
  } else {
    const custom: GraphSpecs = {
      [id]: spec as GraphSpec,
    }

    _bundle(spec as GraphSpec, specs, custom, new Set())

    return {
      unit: {
        id,
        ...unit,
      },
      specs: custom,
    }
  }
}

export function unitBundleSpecById(id: string, specs: Specs): UnitBundleSpec {
  const spec = getSpec(specs, id)

  const { base } = spec

  if (base) {
    return {
      unit: {
        id,
      },
    }
  } else {
    const custom: GraphSpecs = {
      [id]: spec as GraphSpec,
    }

    _bundle(spec as GraphSpec, specs, custom, new Set())

    return {
      unit: {
        id,
      },
      specs: custom,
    }
  }
}

export function bundleSpec(spec: GraphSpec, specs: Specs): BundleSpec {
  const custom: GraphSpecs = {}

  const branch = new Set<string>([])

  _bundle(spec, specs, custom, branch)

  return { spec, specs: custom }
}

function _bundle(
  spec: GraphSpec,
  specs: Specs,
  custom: GraphSpecs,
  branch: Set<string>
): void {
  if (!spec.id) {
    throw new Error('spec id is required')
  }

  if (spec.system) {
    return
  }

  if (branch.has(spec.id)) {
    return
  }

  branch.add(spec.id)

  _bundleUnits(spec, specs, custom, branch)
}

function _bundleUnits(
  spec: GraphSpec,
  specs: Specs,
  custom: GraphSpecs,
  branch: Set<string>
): void {
  const { units = {} } = spec

  for (const unit_id in units) {
    const unit = units[unit_id]

    const { id } = unit

    const _spec = getSpec(specs, id) as GraphSpec

    if (!specs[id] || !isSystemSpecId(specs, id)) {
      custom[id] = _spec
    }

    _bundle(_spec, specs, custom, new Set(branch))
  }
}
