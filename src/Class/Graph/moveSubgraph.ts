import { SELF } from '../../constant/SELF'
import { isEmptyMerge } from '../../spec/isEmptyMerge'
import {
  forEachPinOnMerge,
  getMergePinCount,
  getMergeTypePinCount,
  getMergeUnitPinCount,
  opposite,
} from '../../spec/util'
import pathGet from '../../system/core/object/DeepGet/f'
import forEachValueKey from '../../system/core/object/ForEachKeyValue/f'
import { keyCount } from '../../system/core/object/KeyCount/f'
import {
  GraphMergeSpec,
  GraphMergesSpec,
  GraphPinSpec,
  GraphPlugOuterSpec,
  GraphSubPinSpec,
} from '../../types'
import { Dict } from '../../types/Dict'
import { GraphUnitConnect } from '../../types/GraphUnitConnect'
import { IO } from '../../types/IO'
import { IOOf, forIO } from '../../types/IOOf'
import { UCG } from '../../types/interface/UCG'
import {
  clone,
  forEachObjKV,
  forEachObjVK,
  getObjSingleKey,
  pathOrDefault,
  pathSet,
} from '../../util/object'
import { GraphMoveSubGraphData } from './interface'

export function moveUnit(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  unitId: string,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  ignoredUnit: Set<string>,
  unitIgnoredPin: Dict<IOOf<Set<string>>>,
  ignoredMerge: Set<string>,
  pinSpecs: IOOf<Dict<GraphPinSpec>>,
  reverse: boolean
) {
  const {
    nextIdMap,
    nextPinIdMap,
    nextSubComponentParentMap,
    nextSubComponentChildrenMap,
  } = collapseMap

  const unit = source.getUnit(unitId)

  const nextUnitId = nextIdMap.unit?.[unitId] || unitId
  const nextSubComponentParent = nextSubComponentParentMap[unitId] || null
  const nextSubComponentChildren = nextSubComponentChildrenMap[unitId] || []
  const nextUnitPinMap = nextPinIdMap[unitId] || {}

  const ignoredPin = unitIgnoredPin[unitId] || {
    input: new Set(),
    output: new Set(),
  }

  source.removeUnit(unitId, false, false, false)

  target.addUnit(nextUnitId, unit, undefined, false)

  if (nextSubComponentParent) {
    if (target.hasUnit(nextSubComponentParent)) {
      target.moveRoot(nextSubComponentParent, nextUnitId, 'default')
    }
  }

  if (nextSubComponentChildren) {
    for (const nextSubComponentChildId of nextSubComponentChildren) {
      if (target.hasUnit(nextSubComponentChildId)) {
        target.moveRoot(nextUnitId, nextSubComponentChildId, 'default')
      }
    }
  }

  const moveUnitPin = (type: IO, pinId: string): void => {
    // console.log('movePinInto', unitId, type, pinId)

    if (!ignoredPin[type].has(pinId) && !unit.isPinIgnored(type, pinId)) {
      const {
        pinId: nextPinId,
        subPinId: nextSubPinId,
        mergeId,
        merge,
      } = pathOrDefault(nextUnitPinMap, [type, pinId], {
        pinId: undefined,
        subPinId: undefined,
      })

      const shouldSwapMergePin =
        mergeId && (!ignoredMerge.has(mergeId) || reverse)

      if (reverse) {
        //
      } else {
        if (target.hasPinNamed(type, nextPinId)) {
          //
        } else {
          forEachObjVK(pinSpecs[type] || {}, ({ plug = {} }, id) => {
            for (const subPinId in plug) {
              const subPinSpec = plug[subPinId]

              if (subPinSpec.unitId === unitId && subPinSpec.pinId === pinId) {
                source.unplugPin(type, id, subPinId, false, false)

                break
              }
            }
          })
        }
      }

      if (nextPinId && nextSubPinId) {
        if (reverse) {
          if (mergeId) {
            if (target.hasMergePin(mergeId, graphId, type, nextPinId)) {
              target.removePinOrMerge(
                mergeId,
                graphId,
                type,
                nextPinId,
                false,
                false
              )
            }
          }

          const { pinId: _pinId, subPinId: _subPinId } =
            connectOpt.plugs?.[type]?.[pinId] || {}

          if (_pinId && _subPinId && _pinId === nextPinId) {
            if (target.hasPinNamed(type, _pinId)) {
              if (target.hasPlug(type, _pinId, _subPinId)) {
                target.unplugPin(type, _pinId, _subPinId, false, false)
              }

              target.plugPin(
                type,
                _pinId,
                _subPinId,
                {
                  unitId: nextUnitId,
                  pinId,
                },
                false,
                false
              )
            } else {
              target.exposePinSet(
                type,
                _pinId,
                {
                  plug: {
                    [_subPinId]: {
                      unitId: nextUnitId,
                      pinId,
                    },
                  },
                },
                undefined,
                false,
                false
              )
            }
          }
        } else {
          if (target.hasPinNamed(type, nextPinId)) {
            target.exposePin(
              type,
              nextPinId,
              nextSubPinId,
              {
                unitId: nextUnitId,
                pinId,
              },
              false
            )
          } else {
            const ref = unit.isPinRef(type, pinId)
            const data = unit.getPinData(type, pinId)

            target.exposePinSet(
              type,
              nextPinId,
              {
                plug: {
                  '0': {
                    unitId: nextUnitId,
                    pinId,
                  },
                },
                ref,
              },
              data,
              false,
              false
            )

            forEachValueKey(pinSpecs[type] || {}, ({ plug }, id) => {
              for (const subPinId in plug) {
                const subPinSpec = plug[subPinId]

                if (
                  subPinSpec.unitId === unitId &&
                  subPinSpec.pinId === pinId
                ) {
                  source.plugPin(
                    type,
                    id,
                    subPinId,
                    {
                      unitId: graphId,
                      pinId: nextPinId,
                    },
                    false
                  )

                  break
                }
              }
            })
          }
        }

        const constant = unit.isPinConstant(type, pinId)

        if (constant) {
          if (reverse) {
            //
          } else {
            target.setUnitPinConstant(unitId, type, pinId, false, false)
            target.setPinConstant(type, nextPinId, true)
          }
        }

        if (shouldSwapMergePin) {
          if (reverse) {
            if (target.hasMergePin(mergeId, graphId, type, pinId)) {
              target.removePinOrMerge(
                mergeId,
                graphId,
                type,
                pinId,
                false,
                false
              )
            }

            if (!target.hasMerge(mergeId)) {
              target.addMerge(merge ?? {}, mergeId, false, false)
            }

            if (!target.hasMergePin(mergeId, nextUnitId, type, pinId)) {
              target.addPinToMerge(
                mergeId,
                nextUnitId,
                type,
                pinId,
                false,
                false
              )
            }
          } else {
            if (!source.hasMerge(mergeId)) {
              source.addMerge(merge ?? {}, mergeId, false, false)
            }

            if (source.hasMergePin(mergeId, unitId, type, pinId)) {
              source.removePinFromMerge(
                mergeId,
                unitId,
                type,
                pinId,
                false,
                false
              )
            }

            if (!source.hasMergePin(mergeId, graphId, type, nextPinId)) {
              source.addPinToMerge(
                mergeId,
                graphId,
                type,
                nextPinId,
                false,
                false
              )
            }
          }
        }
      }
    }
  }

  const inputs = unit.getInputNames()
  for (const input_id of inputs) {
    moveUnitPin('input', input_id)
  }
  const outputs = unit.getOutputNames()
  for (const output_id of outputs) {
    moveUnitPin('output', output_id)
  }
  moveUnitPin('output', SELF)
}

export function moveLinkPinInto(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  unitId: string,
  type: IO,
  pinId: string,
  data: any,
  collapseMap: GraphMoveSubGraphData,
  oppositeMergeId: string | null,
  oppositePinId: string | null,
  plugPinSpec: { pinId: string; subPinId: string } | null,
  ignoredUnit: Set<string> = new Set(),
  reverse: boolean
): void {
  if (ignoredUnit.has(unitId)) {
    return
  }

  const { nextPinIdMap } = collapseMap

  const { mergeId, merge } = pathOrDefault(nextPinIdMap, [type, pinId], {
    pinId: undefined,
    subPinId: undefined,
  })

  if (graphId === unitId) {
    if (mergeId && merge) {
      const mergeUnit = merge[unitId]

      const mergePinCount = getMergePinCount(merge)
      const unitMergePinCount = getMergeUnitPinCount(mergeUnit)

      if (mergePinCount - unitMergePinCount > 0) {
        //
      } else {
        target.coverPinSet(type, pinId, false)
      }
    } else {
      target.coverPinSet(type, pinId, false)
    }
  } else {
    if (oppositeMergeId && oppositePinId) {
      const oppositeType = opposite(type)

      if (reverse) {
        if (source.hasPinNamed(oppositeType, oppositePinId)) {
          source.coverPinSet(oppositeType, oppositePinId, false)
        } else {
          //
        }
      } else {
        if (target.hasPinNamed(oppositeType, oppositePinId)) {
          //
        } else {
          const unit = source.getUnit(unitId)

          data = data ?? source.getUnitPinData(unitId, type, pinId)

          const ref = unit.isPinRef(type, pinId)

          const pinSpec = { plug: { '0': {} }, ref }

          target.exposePinSet(
            oppositeType,
            oppositePinId,
            pinSpec,
            data,
            false,
            false
          )
        }

        if (source.hasMerge(oppositeMergeId)) {
          const merge = source.getMergeSpec(oppositeMergeId)

          if (!merge?.[graphId]?.[oppositeType]?.[oppositePinId]) {
            source.addPinToMerge(
              oppositeMergeId,
              graphId,
              oppositeType,
              oppositePinId,
              false,
              false
            )
          }

          source.addPinToMerge(
            oppositeMergeId,
            unitId,
            type,
            pinId,
            false,
            false
          )
        } else {
          const merge = {
            [unitId]: {
              [type]: {
                [pinId]: true,
              },
            },
            [graphId]: {
              [oppositeType]: {
                [oppositePinId]: true,
              },
            },
          }

          source.addMerge(merge, oppositeMergeId, false, false)
        }
      }
    } else {
      //
    }

    if (plugPinSpec) {
      const nextUnitId = unitId // TODO

      const newPinSpec =
        graphId !== unitId
          ? { plug: { '0': { unitId: nextUnitId, pinId } } }
          : { plug: { '0': {} } }

      target.exposePinSet(
        type,
        plugPinSpec.pinId,
        newPinSpec,
        undefined,
        false,
        false
      )

      source.plugPin(type, plugPinSpec.pinId, plugPinSpec.subPinId, {
        unitId: graphId,
        pinId: plugPinSpec.pinId,
      })
    }
  }
}

export function moveMerge(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  mergeId: string,
  mergeSpec: GraphMergeSpec,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  ignoredUnit: Set<string> = new Set(),
  pinSpecs: IOOf<Dict<GraphPinSpec>>,
  reverse: boolean
) {
  const { nextIdMap, nextMergePinId } = collapseMap

  const nextMergeId = nextIdMap.merge[mergeId] ?? mergeId

  const { input: nextInput = null, output: nextOutput = null } =
    nextMergePinId[mergeId] || {}

  let pinIntoCount = 0

  const sourceMergeSpec = source.getMergeSpec(mergeId)

  const mergeSpecClone = clone(mergeSpec)

  const nextMerge: GraphMergeSpec = {}

  const { merges: graphMerges } = connectOpt

  const mergePinCount = getMergePinCount(mergeSpec)

  const mergeInputCount = getMergeTypePinCount(mergeSpec, 'input')
  const mergeOutputCount = getMergeTypePinCount(mergeSpec, 'output')

  const data = source.getMergeData(mergeId)

  if (source.hasMerge(mergeId)) {
    source.removeMerge(mergeId, false, false)
  }

  const moveMergePin = (unitId: string, type: IO, pinId: string): void => {
    const nextUnitId = nextIdMap.unit?.[unitId] || unitId

    if (nextUnitId === graphId) {
      const pinSpec = target.getExposedPinSpec(type, pinId)

      const { plug } = pinSpec

      for (const subPinId in plug) {
        const subPin = plug[subPinId]

        if (subPin.unitId && subPin.pinId) {
          pathSet(nextMerge, [subPin.unitId, type, subPin.pinId], true)
        } else if (subPin.mergeId) {
          const mergeSpec = target.getMergeSpec(subPin.mergeId)

          forEachPinOnMerge(mergeSpec, (unitId, type, pinId) => {
            pathSet(nextMerge, [nextUnitId, type, pinId], true)
          })
        }
      }

      pinIntoCount++
    } else if (ignoredUnit.has(unitId)) {
      pathSet(nextMerge, [nextUnitId, type, pinId], true)

      pinIntoCount++
    } else {
      //
    }

    const isInput = type === 'input'

    const pickInput = !isInput && !ignoredUnit.has(unitId)

    if ((pickInput && nextInput) || (!pickInput && nextOutput)) {
      const {
        mergeId: nextMergeId,
        pinId: nextPinId,
        subPinSpec: nextSubPinSpec,
      } = pickInput ? nextInput : nextOutput

      moveLinkPinInto(
        source,
        target,
        graphId,
        unitId,
        type,
        pinId,
        data,
        collapseMap,
        nextMergeId,
        nextPinId,
        null,
        ignoredUnit,
        reverse
      )
    }
  }

  forEachPinOnMerge(mergeSpec, moveMergePin)

  if (reverse) {
    if (mergePinCount === 0 || pinIntoCount > 1) {
      target.addMerge(nextMerge, nextMergeId, false, false)
    }
  } else {
    if (
      (pinIntoCount === 0 &&
        (mergePinCount === 0 ||
          (mergeInputCount > 0 && mergeOutputCount > 0))) ||
      pinIntoCount > 1
    ) {
      target.addMerge(nextMerge, nextMergeId, false, false)
    }
  }

  const processMergePin = (
    type: IO,
    nextPin: {
      mergeId: string
      pinId: string
      subPinSpec: GraphSubPinSpec
      oppositeMerge?: GraphMergeSpec
    }
  ) => {
    const { mergeId: _mergeId, pinId, subPinSpec, oppositeMerge } = nextPin

    if (pinId && subPinSpec) {
      if (reverse) {
        // if (source.hasPinNamed(type, pinId)) {
        //   if (source.getPinPlugCount(type, pinId) > 1) {
        //     source.coverPin(type, pinId, '0', false)
        //   } else {
        //     source.coverPinSet(type, pinId, false)
        //   }
        // }

        if (target.hasMergePin(_mergeId, graphId, type, pinId)) {
          target.removePinOrMerge(_mergeId, graphId, type, pinId, false, false)
        }

        for (const graphMergeId in graphMerges) {
          const merge = graphMerges[graphMergeId]

          const graphMerge = merge[graphId]

          if (graphMerge?.output?.[SELF]) {
            return
          }

          for (const graphPinType in graphMerge) {
            const graphMergeTypePins = graphMerge[graphPinType]

            for (const graphPinId in graphMergeTypePins) {
              if (graphPinId !== pinId) {
                continue
              }

              const pinSpec = pinSpecs[graphPinType][graphPinId]

              const { plug } = pinSpec

              for (const subPinId in plug) {
                const subPinSpec = plug[subPinId]

                if (subPinSpec.mergeId) {
                  const newMergeId =
                    nextIdMap.merge?.[subPinSpec.mergeId] || subPinSpec.mergeId

                  const mergeClone = clone(merge)

                  delete mergeClone[graphId]

                  const otherUnitId = getObjSingleKey(mergeClone)
                  const otherUnitPinType = getObjSingleKey(
                    mergeClone[otherUnitId]
                  ) as IO
                  const otherUnitPinId = getObjSingleKey(
                    mergeClone[otherUnitId][otherUnitPinType]
                  )

                  if (target.hasMerge(newMergeId)) {
                    forEachPinOnMerge(mergeClone, (unitId, type, pinId) => {
                      if (
                        !target.hasMergePin(newMergeId, unitId, type, pinId)
                      ) {
                        target.addPinToMerge(
                          newMergeId,
                          unitId,
                          type,
                          pinId,
                          false
                        )
                      }
                    })
                  } else {
                    const newMergeSpec = {
                      [otherUnitId]: {
                        [otherUnitPinType]: { [otherUnitPinId]: true },
                      },
                    }

                    if (!target.hasMerge(newMergeId)) {
                      target.addMerge(newMergeSpec, newMergeId, false, false)
                    }
                  }
                } else if (subPinSpec.unitId && subPinSpec.pinId) {
                  const newUnitId =
                    nextIdMap.unit?.[subPinSpec.unitId] || subPinSpec.unitId

                  if (target.hasMerge(graphMergeId)) {
                    target.addPinToMerge(
                      graphMergeId,
                      newUnitId,
                      graphPinType as IO,
                      subPinSpec.pinId,
                      false
                    )
                  } else {
                    if (oppositeMerge) {
                      const mergeClone = clone(oppositeMerge)

                      delete mergeClone[subPinSpec.unitId]

                      const otherUnitId = getObjSingleKey(mergeClone)

                      if (!otherUnitId) {
                        continue
                      }

                      const otherUnitPinType = getObjSingleKey(
                        mergeClone[otherUnitId]
                      )
                      const otherUnitPinId = getObjSingleKey(
                        mergeClone[otherUnitId][otherUnitPinType]
                      )

                      target.addMerge(
                        {
                          [newUnitId]: {
                            [graphPinType]: { [subPinSpec.pinId]: true },
                          },
                          [otherUnitId]: {
                            [otherUnitPinType]: { [otherUnitPinId]: true },
                          },
                        },
                        mergeId,
                        false,
                        false,
                        undefined
                      )
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        if (target.hasPinNamed(type, pinId)) {
          target.exposePin(type, pinId, '0', subPinSpec, false)
          // if (subPinSpec.mergeId) {
          //   if (target.hasMerge(subPinSpec.mergeId)) {
          //     target.exposePin(type, pinId, '0', subPinSpec, false)
          //   } else {
          //     console.log('A')
          //     target.exposePin(type, pinId, '0', {}, false)
          //   }
          // } else {
          //   if (target.hasUnit(subPinSpec.unitId)) {
          //     target.exposePin(type, pinId, '0', subPinSpec, false)
          //   } else {
          //     console.log('B')
          //     target.exposePin(type, pinId, '0', {}, false)
          //   }
          // }
        } else {
          target.exposePinSet(
            type,
            pinId,
            {
              plug: {
                '0': subPinSpec,
              },
            },
            undefined,
            false,
            false
          )
        }
      }
    }
  }

  nextInput && processMergePin('input', nextInput)
  nextOutput && processMergePin('output', nextOutput)

  forIO(pinSpecs, (type, pinsSpec) => {
    forEachObjKV(pinsSpec, (pinId, pinSpec) => {
      if (
        pathOrDefault(collapseMap, ['nextPlugSpec', type, pinId], undefined)
      ) {
        return
      }

      const { plug } = pinSpec

      for (const subPinId in plug) {
        const subPinSpec = plug[subPinId]

        if (subPinSpec.mergeId === mergeId) {
          const { mergeId: oppositeMergeId, oppositeMerge } =
            (type === 'input' ? nextInput : nextOutput) ?? {}

          if (reverse) {
            // if (target.hasPlug(type, pinId, subPinId)) {
            //   target.unplugPin(type, pinId, subPinId, false, false)
            // }

            if (isEmptyMerge(sourceMergeSpec)) {
              const targetPinSpecs = target.getExposedPinSpecs()

              forEachObjKV(
                targetPinSpecs[type] ?? {},
                (pinId, targetPinSpec) => {
                  const { plug = {} } = targetPinSpec

                  for (const subPinId in plug) {
                    const subPinSpec = plug[subPinId]

                    if (
                      subPinSpec.unitId === graphId &&
                      subPinSpec.pinId === pinId
                    ) {
                      target.unplugPin(type, pinId, subPinId, false, false)
                      target.plugPin(
                        type,
                        pinId,
                        subPinId,
                        {
                          mergeId: oppositeMergeId,
                        },
                        false,
                        false
                      )
                    }
                  }
                }
              )

              if (!oppositeMergeId || !oppositeMerge) {
                continue
              }

              if (target.hasMerge(nextMergeId)) {
                forEachPinOnMerge(oppositeMerge, (unitId, type, pinId) => {
                  if (unitId !== graphId) {
                    if (!target.hasMergePin(nextMergeId, unitId, type, pinId)) {
                      target.addPinToMerge(
                        nextMergeId,
                        unitId,
                        type,
                        pinId,
                        false,
                        false
                      )
                    }
                  }
                })
              } else {
                target.addMerge(oppositeMerge, nextMergeId, false, false)
              }
            }
          } else {
            if (source.hasPlug(type, pinId, subPinId)) {
              const subPinSpec = oppositeMergeId
                ? { mergeId: oppositeMergeId }
                : { unitId: graphId, pinId }

              const hasMerge = target.hasMerge(nextMergeId)

              const data = source.getPinData(type, pinId)

              if (!target.hasPinNamed(type, pinId)) {
                target.exposePinSet(
                  type,
                  pinId,
                  {
                    plug: {
                      [subPinId]: hasMerge ? { mergeId: nextMergeId } : {},
                    },
                  },
                  data,
                  false,
                  false
                )
              } else {
                target.plugPin(
                  type,
                  pinId,
                  subPinId,
                  hasMerge ? { mergeId: nextMergeId } : {},
                  false,
                  false
                )
              }

              if (!source.hasPinNamed(type, pinId)) {
                source.exposePinSet(
                  type,
                  pinId,
                  {
                    plug: {
                      [subPinId]: subPinSpec,
                    },
                  },
                  undefined,
                  false,
                  false
                )
              } else {
                if (source.hasPlug(type, pinId, subPinId)) {
                  source.unplugPin(type, pinId, subPinId, false, false)
                }

                source.plugPin(type, pinId, subPinId, subPinSpec, false, false)
              }
            }
          }
        }
      }
    })
  })
}

export function movePlug(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  type: IO,
  pinId: string,
  pinSpec: GraphPinSpec,
  subPinId: string,
  subPinSpec: GraphSubPinSpec,
  nextPlugSpec: GraphMoveSubGraphData['nextPlugSpec'],
  nextPinIdMap: GraphMoveSubGraphData['nextPinIdMap'],
  nextMergePinId: GraphMoveSubGraphData['nextMergePinId'],
  nextIdMap: GraphMoveSubGraphData['nextIdMap']
) {
  const currentPinSpec = source.getExposedPinSpec(type, pinId)

  const plugCount = keyCount(currentPinSpec.plug ?? {})

  const data = source.getPinData(type, pinId)

  if (plugCount === 1) {
    source.coverPinSet(type, pinId, false)
  } else {
    source.coverPin(type, pinId, subPinId, false)
  }

  const oppositeType = opposite(type)

  const nextPinId = pathOrDefault(
    nextPlugSpec,
    [type, pinId, subPinId, 'pinId'],
    pinId
  )

  const nextType = pathOrDefault(
    nextIdMap,
    ['plug', type, pinId, subPinId, 'type'],
    type
  )

  const nextSubPinId = pathOrDefault(
    nextIdMap,
    ['plug', type, pinId, subPinId, 'subPinId'],
    subPinId
  )

  const nextSubPinSpec = pathOrDefault(
    nextPlugSpec,
    [type, pinId, subPinId],
    {}
  )

  let nextSubPinSpec_ = nextSubPinSpec

  if (
    nextSubPinSpec.unitId &&
    nextSubPinSpec.pinId &&
    target.hasUnit(nextSubPinSpec.unitId)
  ) {
    //
  } else if (
    nextSubPinSpec.mergeId &&
    target.hasMerge(nextSubPinSpec.mergeId)
  ) {
    //
  } else {
    nextSubPinSpec_ = {}
  }

  if (target.hasPinNamed(nextType, pinId)) {
    target.exposePin(
      nextType,
      pinId,
      nextSubPinId,
      nextSubPinSpec_,
      false,
      false
    )
  } else {
    target.exposePinSet(
      nextType,
      pinId,
      {
        plug: {
          [nextSubPinId]: nextSubPinSpec_,
        },
      },
      data,
      false,
      false
    )
  }

  if (subPinSpec.unitId && subPinSpec.pinId) {
    let nextMergeId = pathOrDefault(
      nextIdMap,
      ['link', subPinSpec.unitId, subPinSpec.type, pinId, 'mergeId'],
      null
    )

    if (nextMergeId) {
      source.addPinToMerge(
        nextMergeId,
        graphId,
        nextType,
        nextPinId,
        false,
        false
      )
    } else {
      nextMergeId = pathOrDefault(
        nextIdMap,
        ['plug', type, pinId, subPinId, 'mergeId'],
        null
      )

      if (nextMergeId) {
        if (source.hasMerge(nextMergeId)) {
          source.addPinToMerge(
            nextMergeId,
            graphId,
            nextType,
            nextPinId,
            false,
            false
          )
        } else {
          source.addMerge(
            {
              [graphId]: {
                [nextType]: {
                  [nextPinId]: true,
                },
              },
              [subPinSpec.unitId]: {
                [type]: {
                  [subPinSpec.pinId]: true,
                },
              },
            },
            nextMergeId,
            false,
            false,
            undefined
          )
        }
      }
    }
  } else if (subPinSpec.mergeId) {
    const nextMergeId = pathOrDefault(
      nextMergePinId,
      ['merge', subPinSpec.mergeId, type],
      null
    )

    if (nextMergeId) {
      source.addPinToMerge(
        nextMergeId,
        graphId,
        nextType,
        nextPinId,
        false,
        false
      )
    } else {
      const nextMergeId = pathOrDefault(
        nextIdMap,
        ['plug', type, pinId, subPinId, 'mergeId'],
        null
      )

      if (nextMergeId) {
        source.addPinToMerge(
          nextMergeId,
          graphId,
          nextType,
          nextPinId,
          false,
          false
        )
      }
    }
  }
}

export type GraphLike<T extends UCG = UCG> = Pick<
  T,
  | 'getMergeSpec'
  | 'getMergesSpec'
  | 'coverPinSet'
  | 'hasPinNamed'
  | 'hasMergePin'
  | 'getUnit'
  | 'exposePinSet'
  | 'getUnitPinData'
  | 'hasUnit'
  | 'addUnit'
  | 'removeUnit'
  | 'removeMerge'
  | 'moveRoot'
  | 'unplugPin'
  | 'plugPin'
  | 'exposePin'
  | 'setPinData'
  | 'addPinToMerge'
  | 'getPinPlugCount'
  | 'getPinData'
  | 'setPinConstant'
  | 'setUnitPinConstant'
  | 'hasPlug'
  | 'coverPin'
  | 'isUnitPinRef'
  | 'addMerge'
  | 'hasMerge'
  | 'getExposedPinSpec'
  | 'getExposedPinSpecs'
  | 'removePinOrMerge'
  | 'removePinFromMerge'
  | 'isPinConstant'
  | 'getPlugSpecs'
  | 'getSubPinSpec'
  | 'getMergeData'
>

export function moveSubgraph<T extends UCG<any, any, any>>(
  source: GraphLike<T>,
  target: GraphLike<T>,
  graphId: string,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  reverse: boolean = true
) {
  const {
    nodeIds,
    nextIdMap,
    nextPinIdMap,
    nextMergePinId,
    nextPlugSpec,
    nextSubComponentParentMap,
    nextSubComponentChildrenMap,
  } = collapseMap

  const { merge = [], link = [], unit = [], plug = [] } = nodeIds

  const mergeSpecs = clone(source.getMergesSpec())
  const pinSpecs = clone(source.getExposedPinSpecs())

  const ignoredUnitPin: Dict<{ input: Set<string>; output: Set<string> }> = {}
  const ignoredUnit = new Set<string>(unit)
  const ignoredMerge = new Set<string>(merge)

  const setUnitPinIgnored = (unitId: string, type: IO, pinId: string) => {
    // console.log('setUnitPinIgnored', unitId, type, pinId)

    ignoredUnitPin[unitId] = ignoredUnitPin[unitId] || {
      input: new Set(),
      output: new Set(),
    }

    ignoredUnitPin[unitId][type].add(pinId)
  }

  const findUnitPinPlug = (
    unitId: string,
    type: IO,
    pinId: string
  ): GraphPlugOuterSpec => {
    let plugSpec: GraphPlugOuterSpec | undefined

    forEachObjKV(pinSpecs[type], (_pinId, _pinSpec: GraphPinSpec) => {
      const { plug } = _pinSpec

      for (const subPinId in plug) {
        const subPin = plug[subPinId]

        if (subPin.unitId === unitId && subPin.pinId === pinId) {
          plugSpec = {
            type,
            pinId: _pinId,
            subPinId,
          }
        }
      }
    })

    return plugSpec
  }

  for (const { unitId, type, pinId } of link) {
    const pinPlug = findUnitPinPlug(unitId, type, pinId)

    if (
      pinPlug &&
      !plug.find((plugObj) => {
        return (
          plugObj.type === pinPlug.type &&
          plugObj.pinId === pinPlug.pinId &&
          plugObj.subPinId === pinPlug.subPinId
        )
      })
    ) {
      continue
    }

    setUnitPinIgnored(unitId, type, pinId)
  }

  const nextMergeSpecs: GraphMergesSpec = {}

  for (const mergeId of merge) {
    if (source.hasMerge(mergeId)) {
      const mergeSpec = source.getMergeSpec(mergeId)

      nextMergeSpecs[mergeId] = mergeSpec

      forEachPinOnMerge(mergeSpec, (unitId, type, pinId) => {
        setUnitPinIgnored(unitId, type, pinId)
      })
    }
  }

  for (const { unitId, type, pinId } of link) {
    const { mergeId, oppositePinId } = pathOrDefault(
      nextIdMap,
      ['link', unitId, type, pinId],
      { mergeId: null, oppositePinId: null }
    )

    const plugPinSpec: { pinId: string; subPinId: string } | null = null

    moveLinkPinInto(
      source,
      target,
      graphId,
      unitId,
      type,
      pinId,
      undefined,
      collapseMap,
      mergeId,
      oppositePinId,
      plugPinSpec,
      ignoredUnit,
      reverse
    )
  }

  for (const unitId of unit) {
    moveUnit(
      source,
      target,
      graphId,
      unitId,
      collapseMap,
      connectOpt,
      ignoredUnit,
      ignoredUnitPin,
      ignoredMerge,
      pinSpecs,
      reverse
    )
  }

  for (const mergeId of merge) {
    const mergeSpec = mergeSpecs[mergeId]

    moveMerge(
      source,
      target,
      graphId,
      mergeId,
      mergeSpec,
      collapseMap,
      connectOpt,
      ignoredUnit,
      pinSpecs,
      reverse
    )
  }

  for (const { type, pinId, subPinId } of plug) {
    const pinSpec = pathGet(pinSpecs, [type, pinId])
    const subPinSpec = pathGet(pinSpecs, [type, pinId, 'plug', subPinId])

    movePlug(
      source,
      target,
      graphId,
      type,
      pinId,
      pinSpec,
      subPinId,
      subPinSpec,
      nextPlugSpec,
      nextPinIdMap,
      nextMergePinId,
      nextIdMap
    )
  }
}
