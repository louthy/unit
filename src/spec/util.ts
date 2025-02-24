import { GraphMoveSubGraphData } from '../Class/Graph/interface'
import { getSpec } from '../client/spec'
import forEachValueKey from '../system/core/object/ForEachKeyValue/f'
import { keyCount } from '../system/core/object/KeyCount/f'
import { keys } from '../system/f/object/Keys/f'
import {
  GraphComponentSpec,
  GraphMergeSpec,
  GraphMergeUnitSpec,
  GraphMergesSpec,
  GraphPinSpec,
  GraphPinsSpec,
  GraphPlugOuterSpec,
  GraphSubPinSpec,
  GraphUnitSpec,
  PinSpec,
  Spec,
  Specs,
} from '../types'
import { Dict } from '../types/Dict'
import { GraphSpec } from '../types/GraphSpec'
import { GraphUnitMerges } from '../types/GraphUnitMerges'
import { GraphUnitPlugs } from '../types/GraphUnitPlugs'
import { IO } from '../types/IO'
import { IOOf } from '../types/IOOf'
import { GraphSelection } from '../types/interface/G'
import {
  _keyCount,
  clone,
  mapObjVK,
  pathOrDefault,
  pathSet,
  reduceObj,
} from '../util/object'
import { isEmptyMerge } from './isEmptyMerge'
import { isPinRef } from './reducers/spec_'

export function isValidSpecName(name: string) {
  return !!/^[A-Za-z_ ][A-Za-z\d_ ]*$/g.exec(name)
}

export function getPinNodeId(unitId: string, type: IO, pinId: string): string {
  return `${unitId}/${type}/${pinId}`
}

export function isUnitPinConstant(
  spec: GraphSpec,
  unitId: string,
  type: IO,
  pinId: string
): boolean {
  return pathOrDefault(spec, [unitId, type, pinId, 'constant'], false)
}

export function getInputNodeId(unitId: string, pinId: string): string {
  return getPinNodeId(unitId, 'input', pinId)
}

export function getOutputNodeId(unitId: string, pinId: string): string {
  return getPinNodeId(unitId, 'output', pinId)
}

export function getExposedPinId(id: string, type: string): string {
  return `${type}/${id}`
}

export function getMergePinNodeId(mergeId: string, type: IO): string {
  return `${mergeId}/${type}`
}

export function opposite(kind: IO): IO {
  return kind === 'input' ? 'output' : 'input'
}

export const findFirstMergePin = (
  merge: GraphMergeSpec,
  type: IO
): { unitId: string; pinId: string } | undefined => {
  for (const unitId in merge) {
    if (merge[unitId][type]) {
      for (const pinId in merge[unitId][type]) {
        return {
          unitId,
          pinId,
        }
      }
    }
  }
}

export const getUnitExposedPins = (
  graph: GraphSpec,
  unitId: string
): IOOf<Dict<{ type: IO; pinId: string; subPinId: string }>> => {
  const pins = {
    input: {},
    output: {},
  }

  forEachGraphSpecPin(graph, (type, pinId, pinSpec) => {
    const { plug = {} } = pinSpec

    for (const subPinId in plug) {
      const subPinSpec = plug[subPinId]

      const { unitId: unitId_, pinId: pinId_, mergeId } = subPinSpec

      if (unitId_ === unitId) {
        pathSet(pins, [type, pinId_], {
          type,
          pinId,
          subPinId,
        })
      } else if (mergeId) {
        //
      }
    }
  })

  return pins
}

export const getPinSpec = (
  graph: GraphSpec,
  type: IO,
  pinId: string
): GraphPinSpec => {
  return pathOrDefault(graph, [`${type}s`, pinId], null)
}

export const getPlugSpecs = (spec: GraphSpec) => {
  const plugs = {
    input: {},
    output: {},
  }

  forEachGraphSpecPinPlug(
    spec,
    (type, pinId, pinSpecs, subPinId, subPinSpec) => {
      const plug = getSubPinSpec(spec, type, pinId, subPinId)

      pathSet(plugs, [type, pinId, subPinId], plug)
    }
  )

  return plugs
}

export const getSubPinSpec = (
  graph: GraphSpec,
  type: IO,
  pinId: string,
  subPinId: string
): GraphSubPinSpec => {
  return pathOrDefault(graph, [`${type}s`, pinId, 'plug', subPinId], null)
}

export const findPinMerge = (
  spec: GraphSpec,
  unitId: string,
  type: IO,
  pinId: string
): string | undefined => {
  const { merges = {} } = spec
  for (const mergeId in merges) {
    const merge = merges[mergeId]

    if (merge?.[unitId]?.[type]?.[pinId]) {
      return mergeId
    }
  }
}

export const getPlugCount = (
  spec: GraphSpec,
  type: IO,
  pinId: string
): number => {
  return keyCount(pathOrDefault(spec, [`${type}s`, pinId, 'plug'], {}))
}

export const getMergePinCount = (merge: GraphMergeSpec): number => {
  return reduceObj(
    merge,
    (count, mergeUnit) => {
      return count + getMergeUnitPinCount(mergeUnit)
    },
    0
  )
}

export const getMergePinTypeCount = (
  merge: GraphMergeSpec,
  type: IO
): number => {
  return reduceObj(
    merge,
    (count, mergeUnit) => {
      return count + getMergeUnitTypePinCount(mergeUnit, type)
    },
    0
  )
}

export const getMergeTypePinCount = (
  merge: GraphMergeSpec,
  type: IO
): number => {
  return reduceObj(
    merge,
    (count, mergeUnit) => {
      return count + getMergeUnitTypePinCount(mergeUnit, type)
    },
    0
  )
}

export const getMergeUnitPinCount = (mergeUnit: GraphMergeUnitSpec): number => {
  return (
    getMergeUnitTypePinCount(mergeUnit, 'input') +
    getMergeUnitTypePinCount(mergeUnit, 'output')
  )
}

export const getMergeUnitTypePinCount = (
  mergeUnit: GraphMergeUnitSpec,
  type: IO
): number => {
  const { [type]: pins = {} } = mergeUnit

  const pinCount = _keyCount(pins)

  return pinCount
}

export const forEachPinOnMerges = <T>(
  merges: Dict<Dict<IOOf<Dict<T>>>>,
  callback: (
    mergeId: string,
    unitId: string,
    type: IO,
    pinId: string,
    data: T
  ) => void
) => {
  forEachValueKey(merges || {}, (merge, mergeId) => {
    forEachPinOnMerge(merge, (unitId, type, pinId, data) =>
      callback(mergeId, unitId, type, pinId, data)
    )
  })
}

export const forEachPinOnMerge = <T>(
  merge: Dict<IOOf<Dict<T>>>,
  callback: (unitId: string, type: IO, pinId: string, data: T) => void
) => {
  forEachValueKey(merge, ({ input, output }, unitId) => {
    forEachValueKey(input || {}, (_, inputId) => {
      callback(unitId, 'input', inputId, _)
    })
    forEachValueKey(output || {}, (_, outputId) => {
      callback(unitId, 'output', outputId, _)
    })
  })
}

export const forEachSpecPin = (
  spec: Spec,
  callback: (type: IO, pinId: string, pinSpec: PinSpec) => void
) => {
  const { inputs = {}, outputs = {} } = spec
  forEachValueKey(inputs, (inputSpec, inputId) => {
    callback('input', inputId, inputSpec)
  })
  forEachValueKey(outputs, (outputSpec, outputId) => {
    callback('output', outputId, outputSpec)
  })
}

export const forEachGraphSpecPin = (
  spec: GraphSpec,
  callback: (type: IO, pinId: string, pinSpec: GraphPinSpec) => void
) => {
  forEachGraphSpecPinOfType(spec, 'input', (inputId, inputSpec) => {
    callback('input', inputId, inputSpec)
  })
  forEachGraphSpecPinOfType(spec, 'output', (outputSpec, outputId) => {
    callback('output', outputSpec, outputId)
  })
}

export const forEachGraphSpecPinPlug = (
  spec: GraphSpec,
  callback: (
    type: IO,
    pinId: string,
    pinSpec: GraphPinSpec,
    subPinId: string,
    subPinSpec: GraphSubPinSpec
  ) => void
) => {
  forEachGraphSpecPin(
    spec,
    (type: IO, pinId: string, pinSpec: GraphPinSpec) => {
      for (const subPinId in pinSpec.plug ?? {}) {
        const subPinSpec = pinSpec.plug[subPinId]

        callback(type, pinId, pinSpec, subPinId, subPinSpec)
      }
    }
  )
}

export const forEachGraphSpecPinType = (
  spec: GraphSpec,
  type: IO,
  callback: (type: IO, pinId: string, pinSpec: GraphPinSpec) => void
) => {
  forEachGraphSpecPinOfType(spec, type, (pinId, pinSpec) => {
    callback(type, pinId, pinSpec)
  })
}

export const forEachGraphSpecPinOfType = (
  spec: GraphSpec,
  type: IO,
  callback: (pinId: string, pinSpec: GraphPinSpec) => void
) => {
  forEachValueKey(spec[`${type}s`] ?? {}, (pinSpec, pinId) => {
    callback(pinId, pinSpec)
  })
}

export const hasUnit = (spec: GraphSpec, unitId: string): boolean => {
  return !!spec.units?.[unitId]
}

export const hasMerge = (spec: GraphSpec, mergeId: string): boolean => {
  return !!spec.merges?.[mergeId]
}

export const hasMergePin = (
  spec: GraphSpec,
  mergeId: string,
  unitId: string,
  type: IO,
  pinId: string
): boolean => {
  return !!pathOrDefault(spec, ['merges', mergeId, unitId, type, pinId], false)
}

export const hasPinNamed = (spec: Spec, type: IO, pinId: string): boolean => {
  return !!pathOrDefault(spec, [`${type}s`, pinId], false)
}

export const hasPlug = (
  spec: GraphSpec,
  type: IO,
  pinId: string,
  subPinId: string
): boolean => {
  return !!pathOrDefault(spec, [`${type}s`, pinId, 'plug', subPinId], false)
}

export const findMergePlug = (
  spec: GraphSpec,
  type: IO,
  mergeId: string
): GraphPlugOuterSpec | null => {
  let mergePlug: GraphPlugOuterSpec = null

  forEachGraphSpecPinOfType(spec, type, (pinId, pinSpec) => {
    const { plug = {} } = pinSpec

    for (const subPinId in plug) {
      const subPin = plug[subPinId]

      if (subPin.mergeId === mergeId) {
        mergePlug = {
          pinId,
          type,
          subPinId,
        }
      }
    }
  })

  return mergePlug
}

export function getUnitPlugs(spec: GraphSpec, unit_id: string): GraphUnitPlugs {
  const plugs: GraphUnitPlugs = {
    input: {},
    output: {},
  }

  forEachGraphSpecPinPlug(
    spec,
    (type, pinId, pinSpec, subPinId, subPinSpec) => {
      if (subPinSpec.unitId === unit_id) {
        pathSet(plugs, [type, subPinSpec.pinId], { pinId, subPinId })
      }
    }
  )

  return plugs
}

export const findSpecAtPath = (
  specs: Specs,
  spec: Spec,
  path: string[]
): GraphSpec => {
  if (path.length === 0) {
    return spec as GraphSpec
  } else {
    const [unitId, ...rest] = path

    const unit = (spec as GraphSpec).units[unitId]

    const unitSpec = getSpec(specs, unit.id)

    return findSpecAtPath(specs, unitSpec, rest)
  }
}

export const findUnitAtPath = (
  specs: Specs,
  spec: Spec,
  path: string[],
  unit?: GraphUnitSpec
): GraphUnitSpec => {
  if (path.length === 0) {
    return unit
  } else {
    const [unitId, ...rest] = path

    const unit = (spec as GraphSpec).units[unitId] as GraphUnitSpec

    const unitSpec = getSpec(specs, unit.id)

    return findUnitAtPath(specs, unitSpec, rest, unit)
  }
}

export const shouldExposePin = (
  type: IO,
  pinId: string,
  pinSpec: GraphPinSpec,
  subPinId: string,
  subPinSpec: GraphSubPinSpec,
  merged: boolean,
  outerPlug: GraphPlugOuterSpec | null = null
) => {
  if (merged || outerPlug) {
    return false
  }

  if (keyCount(pinSpec.plug ?? {}) > 1) {
    return true
  }

  if (subPinSpec.pinId === pinId) {
    return false
  }

  return true
}

export function isSubPinSpecRef(
  specs: Specs,
  spec: GraphSpec,
  type: IO,
  subPinSpec: GraphSubPinSpec
) {
  let ref = false

  if (subPinSpec.unitId && subPinSpec.pinId) {
    const unit = spec.units[subPinSpec.unitId]

    const unit_spec = getSpec(specs, unit.id)

    ref = isPinRef({ type, pinId: subPinSpec.pinId }, unit_spec)
  } else if (subPinSpec.mergeId) {
    const merge = spec.merges[subPinSpec.mergeId]

    forEachPinOnMerge(merge, (unitId, type, pinId) => {
      const unit = spec.units[unitId]

      const unit_spec = getSpec(specs, unit.id)

      if (ref === true) {
        return
      }

      ref = isPinRef({ type, pinId: subPinSpec.pinId }, unit_spec)
    })
  }

  return ref
}

export function isPinSpecRef(specs: Specs, spec: GraphSpec, type: IO, pinSpec) {
  const { plug = {} } = pinSpec

  for (const subPinId in plug) {
    const subPinSpec = plug[subPinId]

    if (isSubPinSpecRef(specs, spec, type, subPinSpec)) {
      return true
    }
  }

  return false
}

export function makeFullSpecCollapseMap(
  unitId: string,
  spec: GraphSpec,
  unitIdMap: Dict<string>,
  mergeIdMap: Dict<string>,
  plugIdMap: IOOf<Dict<Dict<string>>>,
  {
    getUnitMerges,
    getUnitPlugs,
    getMerge,
    getPinMergeId,
  }: {
    getUnitMerges: (unitId: string) => GraphUnitMerges
    getUnitPlugs: (unitId: string) => GraphUnitPlugs
    getMerge: (mergeId: string) => GraphMergeSpec
    getPinMergeId: (unitId: string, type: IO, pinId: string) => string
  }
): GraphMoveSubGraphData {
  const { units = {}, merges = {}, inputs = {}, outputs = {} } = spec

  const nodeIds: GraphSelection = {
    unit: keys(units),
    merge: keys(merges),
    plug: [],
  }

  const unitMerges = getUnitMerges(unitId)
  const unitPlugs = getUnitPlugs(unitId)

  const nextIdMap: GraphMoveSubGraphData['nextIdMap'] = {
    unit: unitIdMap,
    merge: mergeIdMap,
    plug: mapObjVK(plugIdMap, (pinMap) =>
      mapObjVK(pinMap, (subPinMap) =>
        mapObjVK(subPinMap, (nextSubPinId) => ({
          subPinId: nextSubPinId,
        }))
      )
    ),
  }
  const nextPinIdMap: GraphMoveSubGraphData['nextPinIdMap'] = {}
  const nextMergePinId: GraphMoveSubGraphData['nextMergePinId'] = {}
  const nextPlugSpec: GraphMoveSubGraphData['nextPlugSpec'] = {}

  const processPins = (type: IO, pins: GraphPinsSpec) => {
    for (const pinId in pins) {
      const pin = pins[pinId]

      processPin(type, pinId, pin)
    }
  }

  const processPin = (type: IO, pinId: string, pin: GraphPinSpec) => {
    const { plug, ref, defaultIgnored } = pin

    const mergeId = getPinMergeId(unitId, type, pinId)

    const merged = !!mergeId

    const outerPlug = pathOrDefault(unitPlugs, [type, pinId], null)

    for (const subPinId in plug) {
      const subPinSpec = plug[subPinId]

      if (
        shouldExposePin(
          type,
          pinId,
          pin,
          subPinId,
          subPinSpec,
          merged,
          outerPlug
        )
      ) {
        nodeIds.plug.push({ type, pinId, subPinId })

        let nextSubPinSpec = {}

        if (subPinSpec.unitId && subPinSpec.pinId) {
          const nextUnitId =
            nextIdMap.unit[subPinSpec.unitId] ?? subPinSpec.unitId

          nextSubPinSpec = {
            unitId: nextUnitId,
            pinId: subPinSpec.pinId,
          }
        } else {
          const nextMergeId =
            nextIdMap.merge[subPinSpec.mergeId] ?? subPinSpec.mergeId

          nextSubPinSpec = {
            mergeId: nextMergeId,
          }
        }

        pathSet(nextPlugSpec, [type, pinId, subPinId], nextSubPinSpec)
      }

      if (subPinSpec.unitId && subPinSpec.pinId) {
        forEachPinOnMerges(
          unitMerges,
          (mergeId, mergeUnitId, mergeUnitType, mergeUnitPinId) => {
            const merge = getMerge(mergeId)
            const merge_clone = clone(merge)

            delete merge_clone[unitId]

            const nextUnitId =
              nextIdMap.unit[subPinSpec.unitId] ?? subPinSpec.unitId

            merge_clone[nextUnitId] = {
              [mergeUnitType]: { [subPinSpec.pinId]: true },
            }

            if (
              mergeUnitId === unitId &&
              mergeUnitType === type &&
              mergeUnitPinId === pinId
            ) {
              pathSet(
                nextPinIdMap,
                [subPinSpec.unitId, mergeUnitType, subPinSpec.pinId],
                {
                  pinId,
                  subPinId,
                  ref,
                  defaultIgnored,
                  mergeId,
                  merge: merge_clone,
                }
              )
            }
          }
        )
      } else if (subPinSpec.mergeId) {
        const mergeSpec = merges[subPinSpec.mergeId]

        if (isEmptyMerge(mergeSpec)) {
          const mergeId = getPinMergeId(unitId, type, pinId)

          if (mergeId) {
            const merge = getMerge(mergeId)

            const oppositeMerge = clone(merge)

            delete oppositeMerge[unitId]

            pathSet(nextMergePinId, [subPinSpec.mergeId, type], {
              mergeId,
              pinId,
              subPinSpec: {
                mergeId,
              },
              oppositeMerge,
            })
          } else {
            pathSet(nextMergePinId, [subPinSpec.mergeId, type], {
              mergeId: null,
              pinId: null,
              subPinSpec: {},
              oppositeMerge: {},
            })
          }
        } else {
          const nextMergeId =
            mergeIdMap[subPinSpec.mergeId] ?? subPinSpec.mergeId

          const oppositeType = opposite(type)

          const oppositeMerge = unitMerges[mergeId] ?? {}

          pathSet(nextMergePinId, [subPinSpec.mergeId, oppositeType], {
            mergeId: nextMergeId,
            pinId,
            subPinSpec: {},
            oppositeMerge,
          })
        }
      }
    }
  }

  processPins('input', inputs)
  processPins('output', outputs)

  const collapseMap = {
    nodeIds,
    nextSpecId: null,
    nextIdMap,
    nextPinIdMap,
    nextMergePinId,
    nextPlugSpec,
    nextUnitPinMergeMap: {},
    nextSubComponentParentMap: {},
    nextSubComponentChildrenMap: {},
    nextSubComponentIndexMap: {},
  }

  return collapseMap
}

export function getUnitMergesSpec(
  spec: GraphSpec,
  unitId: string
): GraphMergesSpec {
  const { merges } = spec

  const unit_merges: GraphMergesSpec = {}

  for (const mergeId in merges) {
    const merge = merges[mergeId]

    if (merge[unitId]) {
      unit_merges[mergeId] = merge
    }
  }

  return unit_merges
}

export function getUnitPinDatum(
  spec: GraphSpec,
  unitId: string,
  type: IO,
  pinId: string
) {
  return pathOrDefault(spec, ['units', unitId, type, pinId, 'data'], undefined)
}

export function getUnitInputDatum(
  spec: GraphSpec,
  unitId: string,
  pinId: string
) {
  return getUnitPinDatum(spec, unitId, 'input', pinId)
}

export function getSubComponentParentId(
  spec: GraphSpec,
  unitId: string
): string | null {
  return getComponentSubComponentParentId(spec.component, unitId)
}

export function getComponentSubComponentParentId(
  componentSpec: GraphComponentSpec,
  unitId: string
): string | null {
  const { subComponents } = componentSpec

  for (const subComponentId in subComponents) {
    const subComponent = subComponents[subComponentId]

    const { children = [] } = subComponent

    for (const childId of children) {
      if (childId === unitId) {
        return subComponentId
      }
    }
  }

  return null
}
