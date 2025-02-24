import { Graph } from '../Class/Graph'
import Merge from '../Class/Merge'
import { Unit, UnitEvents } from '../Class/Unit'
import { Pin } from '../Pin'
import { State } from '../State'
import { System } from '../system'
import forEachValueKey from '../system/core/object/ForEachKeyValue/f'
import { keys } from '../system/f/object/Keys/f'
import {
  Action,
  GraphMergeSpec,
  GraphMergesSpec,
  GraphPinSpec,
  GraphPinsSpec,
  GraphSubPinSpec,
  GraphUnitSpec,
  GraphUnitsSpec,
  Specs,
} from '../types'
import { BundleSpec } from '../types/BundleSpec'
import { Dict } from '../types/Dict'
import { GraphBundle } from '../types/GraphClass'
import { GraphSpec } from '../types/GraphSpec'
import { GraphState } from '../types/GraphState'
import { IO } from '../types/IO'
import { IOOf } from '../types/IOOf'
import { UnitBundle } from '../types/UnitBundle'
import { UnitBundleSpec } from '../types/UnitBundleSpec'
import { UnitClass } from '../types/UnitClass'
import { C } from '../types/interface/C'
import { ComponentEvents, Component_ } from '../types/interface/Component'
import { G, G_MoveSubgraphIntoArgs } from '../types/interface/G'
import { U } from '../types/interface/U'

export function lazyFromSpec(
  spec: GraphSpec,
  specs: Specs,
  branch: Dict<true> = {},
  fromSpec: (spec: GraphSpec, specs: Specs, branch: Dict<true>) => GraphBundle
): UnitClass {
  const { inputs, outputs, id } = spec

  class Lazy<
      I extends Dict<any>,
      O extends Dict<any>,
      _EE extends UnitEvents<_EE> = UnitEvents<{}>
    >
    extends Unit<I, O, _EE>
    implements G, C
  {
    static __bundle: UnitBundleSpec = {
      unit: {
        id,
      },
      specs: {},
    }

    public __ = ['U', 'G']

    public stateful: boolean = false // RETURN __stateful
    public __element: boolean = false // RETURN __element

    private __graph: Graph

    private _merge: { input: Dict<Merge<any>>; output: Dict<Merge<any>> } = {
      input: {},
      output: {},
    }

    constructor(system: System) {
      super(
        {
          i: keys(inputs),
          o: keys(outputs),
        },
        branch,
        system,
        spec.id
      )

      for (const name in this._input) {
        const i = this._input[name]

        i.addListener('data', (data) => {
          this._ensure()
        })
      }

      this.addListener('play', () => {
        if (this.__graph) {
          this.__graph.play()
        }
      })

      this.addListener('pause', () => {
        if (this.__graph) {
          this.__graph.pause()
        }
      })

      this.addListener('take_err', () => {
        this.__graph.takeErr()
      })

      this.addListener('reset', () => {
        if (this.__graph) {
          this.__graph.reset()
        }
      })
    }

    fork(): void {
      this._ensure()
      return this.__graph.fork()
    }

    startTransaction(): void {
      this._ensure()
      return this.__graph.startTransaction()
    }

    endTransaction(): void {
      this._ensure()
      return this.__graph.endTransaction()
    }

    getMergeData(mergeId: string) {
      this._ensure()
      return this.__graph.getPlugSpecs()
    }

    getPlugSpecs(): IOOf<Dict<Dict<GraphSubPinSpec>>> {
      this._ensure()
      return this.__graph.getPlugSpecs()
    }

    hasMergePin(
      mergeId: string,
      unitId: string,
      type: IO,
      pinId: string
    ): boolean {
      this._ensure()
      return this.__graph.hasMergePin(mergeId, unitId, type, pinId)
    }

    getMergesSpec(): GraphMergesSpec {
      this._ensure()
      return this.__graph.getMergesSpec()
    }

    getUnitPinData(unitId: string, type: IO, pinId: string): void {
      this._ensure()
      return this.__graph.getUnitPinData(unitId, type, pinId)
    }

    isUnitPinRef(unitId: string, type: IO, pinId: string): boolean {
      this._ensure()
      return this.__graph.isUnitPinRef(unitId, type, pinId)
    }

    getExposedPinSpecs(): IOOf<GraphPinsSpec> {
      this._ensure()
      return this.__graph.getExposedPinSpecs()
    }

    getPinPlugCount(type: IO, pinId: string): number {
      this._ensure()
      return this.__graph.getPinPlugCount(type, pinId)
    }

    moveRoot(parentId: string, childId: string, slotName: string): void {
      this._ensure()
      return this.__graph.moveRoot(parentId, childId, slotName)
    }

    hasPlug(type: IO, pinId: string, subPinId: string): boolean {
      this._ensure()
      return this.__graph.hasPlug(type, pinId, subPinId)
    }

    removePinOrMerge(
      mergeId: string,
      unitId: string,
      type: IO,
      pinId: string,
      ...extra: any[]
    ): void {
      this._ensure()
      return this.__graph.removePinOrMerge(
        mergeId,
        unitId,
        type,
        pinId,
        ...extra
      )
    }

    removeMergeData(mergeId: string) {
      this._ensure()
      return this.__graph.removeMergeData(mergeId)
    }

    setUnitSize(unitId: string, width: number, height: number): void {
      this._ensure()
      return this.__graph.setUnitSize(unitId, width, height)
    }

    setSubComponentSize(unitId: string, width: number, height: number): void {
      this._ensure()
      return this.__graph.setSubComponentSize(unitId, width, height)
    }

    setComponentSize(unitId: string, width: number, height: number): void {
      this._ensure()
      return this.__graph.setComponentSize(unitId, width, height)
    }

    moveSubgraphOutOf(
      ...[
        graphId,
        nextSpecId,
        nodeIds,
        nextIdMap,
        nextPinIdMap,
        nextMergePinId,
        nextPlugSpec,
        nextSubComponentParentMap,
        nextSubComponentChildrenMap,
      ]: G_MoveSubgraphIntoArgs
    ): void {
      this._ensure()
      return this.__graph.moveSubgraphOutOf(
        graphId,
        nextSpecId,
        nodeIds,
        nextIdMap,
        nextPinIdMap,
        nextMergePinId,
        nextPlugSpec,
        nextSubComponentParentMap,
        nextSubComponentChildrenMap
      )
    }

    removeUnitPinData(unitId: string, type: IO, pinId: string) {
      this._ensure()
      return this.__graph.removeUnitPinData(unitId, type, pinId)
    }

    addUnitSpecs(units: GraphUnitsSpec): void {
      this._ensure()
      return this.__graph.addUnitSpecs(units)
    }

    addUnitSpec(
      unitId: string,
      unit: UnitBundleSpec,
      emit?: boolean
    ): U<any, any> {
      this._ensure()
      return this.__graph.addUnitSpec(unitId, unit)
    }

    bulkEdit(actions: Action[]): void {
      this._ensure()
      return this.__graph.bulkEdit(actions)
    }

    setUnitName(unitId: string, newUnitId: string, name: string): void {
      this._ensure()
      return this.__graph.setUnitName(unitId, newUnitId, name)
    }

    isElement(): boolean {
      this._ensure()
      return this.__graph.isElement()
    }

    getMergeSpec(mergeId: string): GraphMergeSpec {
      this._ensure()
      return this.__graph.getMergeSpec(mergeId)
    }

    reorderRoot(component: Component_<ComponentEvents>, to: number): void {
      this._ensure()
      return this.__graph.reorderRoot(component, to)
    }

    reorderParentRoot(
      component: Component_<ComponentEvents>,
      to: number
    ): void {
      this._ensure()
      return this.__graph.reorderParentRoot(component, to)
    }

    reorderSubComponent(parentId: string, childId: string, to: number): void {
      this._ensure()
      return this.__graph.reorderSubComponent(parentId, childId, to)
    }

    moveSubComponentRoot(
      subComponentId: string,
      children: string[],
      slotMap: Dict<string>
    ): void {
      this._ensure()
      return this.__graph.moveSubComponentRoot(
        subComponentId,
        children,
        slotMap
      )
    }

    appendParentChild(component: Component_, slotName: string): void {
      this._ensure()
      return this.__graph.appendParentChild(component, slotName)
    }

    removeParentChild(component: Component_): void {
      this._ensure()
      return this.__graph.removeParentChild(component)
    }

    removeRoot(subComponentId: string): void {
      this._ensure()
      return this.__graph.removeRoot(subComponentId)
    }

    moveSubgraphInto(
      ...[
        graphId,
        nextSpecId,
        nodeIds,
        nextIdMap,
        nextPinIdMap,
        nextMergePinId,
        nextPlugSpec,
        nextSubComponentParentMap,
        nextSubComponentChildrenMap,
      ]: G_MoveSubgraphIntoArgs
    ): void {
      this._ensure()
      return this.__graph.moveSubgraphInto(
        graphId,
        nextSpecId,
        nodeIds,
        nextIdMap,
        nextPinIdMap,
        nextMergePinId,
        nextPlugSpec,
        nextSubComponentParentMap,
        nextSubComponentChildrenMap
      )
    }

    registerRoot(component: Component_): void {
      this._ensure()
      return this.__graph.registerRoot(component)
    }

    unregisterRoot(component: Component_): void {
      this._ensure()
      return this.__graph.unregisterRoot(component)
    }

    registerParentRoot(component: Component_, slotName: string): void {
      this._ensure()
      return this.__graph.registerParentRoot(component, slotName)
    }

    unregisterParentRoot(component: Component_): void {
      this._ensure()
      return this.__graph.unregisterParentRoot(component)
    }

    private _load(): void {
      const Class = fromSpec(spec, specs, branch)

      this.__graph = new Class(this.__system)

      this.__graph.addListener('err', (err) => {
        this.err(err)
      })
      this.__graph.addListener('take_err', () => {
        this.takeErr()
      })

      forEachValueKey(this.__graph.getOutputs(), (output, name) => {
        const merge = new Merge(this.__system)
        merge.play()
        this._merge.output[name] = merge
        merge.setInput(name, output)
        merge.setOutput(name, this._output[name])
      })
      forEachValueKey(this.__graph.getInputs(), (input, name) => {
        const merge = new Merge(this.__system)
        merge.play()
        this._merge.input[name] = merge
        merge.setInput(name, this._input[name])
        merge.setOutput(name, input)
      })

      this.__graph.play()
    }

    private _ensure() {
      // console.log('Lazy', '_ensure')
      if (!this.__graph) {
        this._load()
      }
    }

    public getSpec = (): GraphSpec => {
      this._ensure()
      return this.__graph.getSpec()
    }

    public getBundleSpec(): BundleSpec {
      this._ensure()
      return this.__graph.getBundleSpec()
    }

    public getUnitState(unitId: string): State {
      this._ensure()
      return this.__graph.getUnitState(unitId)
    }

    public getGraphState(): GraphState {
      this._ensure()
      return this.__graph.getGraphState()
    }

    public getGraphChildren(): Dict<any> {
      this._ensure()
      return this.__graph.getGraphChildren()
    }

    public pushChild(Bundle: UnitBundle): number {
      this._ensure()
      return this.__graph.pushChild(Bundle)
    }

    public appendChild(Bundle: UnitBundle): number {
      this._ensure()
      return this.__graph.appendChild(Bundle)
    }

    public insertChild(Bundle: UnitBundle<Component_>, at: number): void {
      this._ensure()
      return this.__graph.insertChild(Bundle, at)
    }

    public pullChild(at: number): Component_ {
      this._ensure()
      return this.__graph.pullChild(at)
    }

    public removeChild(at: number): Component_ {
      this._ensure()
      return this.__graph.removeChild(at)
    }

    public hasChild(at: number): boolean {
      this._ensure()
      return this.__graph.hasChild(at)
    }

    public refChild(at: number): Component_ {
      this._ensure()
      return this.__graph.refChild(at)
    }

    public refChildren(): Component_[] {
      this._ensure()
      return this.__graph.refChildren()
    }

    public refSlot(slotName: string): Component_ {
      this._ensure()
      return this.__graph.refSlot(slotName)
    }

    public getUnits = (): Dict<Unit> => {
      this._ensure()
      return this.__graph.getUnits()
    }

    public exposeOutputSets = (outputs: GraphPinsSpec): void => {
      this._ensure()
      return this.__graph.exposeOutputSets(outputs)
    }

    public exposeOutputSet = (input: GraphPinSpec, id: string): void => {
      this._ensure()
      return this.__graph.exposePinSet('output', id, input)
    }

    public exposeOutput = (
      subPinId: string,
      pinSpec: GraphSubPinSpec,
      id: string
    ): void => {
      this._ensure()
      return this.__graph.exposeOutput(subPinId, pinSpec, id)
    }

    public coverOutputSet = (id: string): void => {
      this._ensure()
      this.__graph.coverOutputSet(id)
    }

    public coverOutput = (subPinId: string, id: string): void => {
      this._ensure()
      return this.__graph.coverOutput(subPinId, id)
    }

    public plugOutput = (
      subPinId: string,
      subPin: GraphSubPinSpec,
      id: string
    ): void => {
      this._ensure()
      return this.__graph.plugOutput(subPinId, subPin, id)
    }

    public unplugOutput = (subPinId: string, id: string): void => {
      this._ensure()
      return this.__graph.unplugOutput(subPinId, id)
    }

    public isExposedOutput(pin: GraphSubPinSpec): boolean {
      this._ensure()
      return this.__graph.isExposedOutput(pin)
    }

    public exposeInputSets = (inputs: GraphPinsSpec): void => {
      this._ensure()
      return this.__graph.exposeInputSets(inputs)
    }

    public exposeInputSet = (input: GraphPinSpec, pinId: string): void => {
      this._ensure()
      return this.__graph.exposeInputSet(input, pinId)
    }

    public exposePinSet = (
      type: IO,
      pinId: string,
      pinSpec: GraphPinSpec
    ): void => {
      this._ensure()
      return this.__graph.exposePinSet(type, pinId, pinSpec)
    }

    public setPinSetId(type: IO, pinId: string, nextPinId: string): void {
      this._ensure()
      return this.__graph.setPinSetId(type, pinId, nextPinId)
    }

    public setPinSetFunctional(
      type: IO,
      name: string,
      functional: boolean
    ): void {
      this._ensure()
      return this.__graph.setPinSetFunctional(type, name, functional)
    }

    public exposePin = (
      type: IO,
      pinId: string,
      subPinId: string,
      subPinSpec: GraphSubPinSpec
    ): void => {
      this._ensure()
      return this.__graph.exposePin(type, pinId, subPinId, subPinSpec)
    }

    public exposeInput = (
      subPinId: string,
      pinSpec: GraphSubPinSpec,
      pinId: string
    ): void => {
      this._ensure()
      return this.__graph.exposeInput(subPinId, pinSpec, pinId)
    }

    public coverInputSet = (id: string): void => {
      this._ensure()
      return this.__graph.coverInputSet(id)
    }

    public coverInput = (subPinId: string, id: string): void => {
      this._ensure()
      return this.__graph.coverInput(subPinId, id)
    }

    public coverPinSet = (type: IO, id: string, emit: boolean = true): void => {
      this._ensure()

      return this.__graph.coverPinSet(type, id, emit)
    }

    public plugPin = (
      type: IO,
      pinId: string,
      subPinId: string,
      subPinSpec: GraphSubPinSpec
    ): void => {
      this._ensure()
      return this.plugPin(type, pinId, subPinId, subPinSpec)
    }

    public plugInput = (
      subPinId: string,
      subPin: GraphSubPinSpec,
      id: string
    ): void => {
      this._ensure()
      return this.plugInput(subPinId, subPin, id)
    }

    public unplugInput = (subPinId: string, id: string): void => {
      this._ensure()
      return this.unplugInput(subPinId, id)
    }

    public coverPin = (type: IO, id: string, subPinId: string): void => {
      this._ensure()
      return this.__graph.coverPin(type, id, subPinId)
    }

    public getSubPinSpec = (
      type: IO,
      pinId: string,
      subPinId: string
    ): GraphSubPinSpec => {
      this._ensure()
      return this.__graph.getSubPinSpec(type, pinId, subPinId)
    }

    public unplugPin = (type: IO, pinId: string, subPinId: string): void => {
      this._ensure()
      return this.__graph.unplugPin(type, pinId, subPinId)
    }

    public isExposedInput(pin: GraphSubPinSpec): boolean {
      this._ensure()
      return this.__graph.isExposedInput(pin)
    }

    public getExposedInputPin = (id: string): Pin<I[keyof I]> => {
      this._ensure()
      return this.__graph.getExposedInputPin(id)
    }

    public getExposedOutputPin = (id: string): Pin<O[keyof O]> => {
      this._ensure()
      return this.__graph.getExposedOutputPin(id)
    }

    public getExposedPinSpec(pinId: string, type: IO): GraphPinSpec {
      this._ensure()
      return this.__graph.getExposedPinSpec(type, pinId)
    }

    public isExposedInputPinId(pinId: string): boolean {
      this._ensure()
      return this.__graph.isExposedInputPinId(pinId)
    }

    public isExposedOutputPinId(pinId: string): boolean {
      this._ensure()
      return this.__graph.isExposedOutputPinId(pinId)
    }

    public getExposedInputSpec(pinId: string): GraphPinSpec {
      this._ensure()
      return this.__graph.getExposedInputSpec(pinId)
    }

    public getExposedOutputSpec(pinId: string): GraphPinSpec {
      this._ensure()
      return this.__graph.getExposedOutputSpec(pinId)
    }

    public hasUnit(id: string): boolean {
      this._ensure()
      return this.__graph.hasUnit(id)
    }

    public hasMerge(id: string): boolean {
      this._ensure()
      return this.__graph.hasMerge(id)
    }

    public getGraphUnitSpec(unitId: string): GraphUnitSpec {
      this._ensure()
      return this.__graph.getGraphUnitSpec(unitId)
    }

    public getUnit(id: string): Unit<any, any> {
      this._ensure()
      return this.__graph.getUnit(id)
    }

    public getUnitByPath(path: string[]): Unit<any, any> {
      this._ensure()
      return this.__graph.getUnitByPath(path)
    }

    public getUnitPin(id: string, type: IO, pinId: string): Pin<any> {
      this._ensure()
      return this.__graph.getUnitPin(id, type, pinId)
    }

    public getUnitData(id: string, type: IO, pinId: string): any {
      this._ensure()
      return this.__graph.getUnitData(id, type, pinId)
    }

    public getUnitInput(id: string, pinId: string): Pin<any> {
      this._ensure()
      return this.__graph.getUnitInput(id, pinId)
    }

    public getUnitOutput(id: string, pinId: string): Pin<any> {
      this._ensure()
      return this.__graph.getUnitOutput(id, pinId)
    }

    public setUnitErr(unitId: string, err: string): void {
      this._ensure()
      return this.__graph.setUnitErr(unitId, err)
    }

    public takeUnitErr(unitId: string): string | null {
      this._ensure()
      return this.__graph.takeUnitErr(unitId)
    }

    public getGraphPinData = (): Dict<any> => {
      this._ensure()
      return this.__graph.getGraphPinData()
    }

    public getGraphErr = (): Dict<string | null> => {
      this._ensure()
      return this.__graph.getGraphErr()
    }

    public getUnitInputData = (unitId: string): Dict<any> => {
      this._ensure()
      return this.__graph.getUnitInputData(unitId)
    }

    public getMerges(): { [id: string]: Unit<any> } {
      this._ensure()
      return this.__graph.getMerges()
    }

    public getMerge(mergeId: string): Unit {
      this._ensure()
      return this.__graph.getMerge(mergeId)
    }

    public getMergeCount(): number {
      this._ensure()
      return this.__graph.getMergeCount()
    }

    public getMergeUnitCount(mergeId: string): number {
      this._ensure()
      return this.__graph.getMergeUnitCount(mergeId)
    }

    public getMergePinCount(mergeId: string): number {
      this._ensure()
      return this.__graph.getMergePinCount(mergeId)
    }

    public addUnits = (units: GraphUnitsSpec): void => {
      this._ensure()
      return this.__graph.addUnitSpecs(units)
    }

    public addUnit = (unitId: string, unit: Unit): void => {
      this._ensure()
      return this.__graph.addUnit(unitId, unit)
    }

    public moveUnit(id: string, unitId: string, inputId: string): void {
      this._ensure()
      return this.__graph.moveUnit(id, unitId, inputId)
    }

    public removeUnit(unitId: string, ...extra: any[]) {
      this._ensure()
      return this.__graph.removeUnit(unitId, ...extra)
    }

    addUnitGhost(
      unitId: string,
      nextUnitId: string,
      nextUnitBundle: UnitBundleSpec,
      nextUnitPinMap: IOOf<Dict<string>>
    ): void {
      this._ensure()
      return this.__graph.addUnitGhost(
        unitId,
        nextUnitId,
        nextUnitBundle,
        nextUnitPinMap
      )
    }

    public removeUnitGhost(
      unitId: string,
      nextUnitId: string,
      nextUnitSpec: GraphSpec
    ): { specId: string; bundle: UnitBundleSpec } {
      this._ensure()
      return this.__graph.removeUnitGhost(unitId, nextUnitId, nextUnitSpec)
    }

    public swapUnitGhost(
      unitId: string,
      nextUnitId: string,
      spec: UnitBundleSpec
    ): void {
      this._ensure()
      this.__graph.swapUnitGhost(unitId, nextUnitId, spec)
    }

    public explodeUnit(
      unitId: string,
      mapUnitId: Dict<string>,
      mapMergeId: Dict<string>,
      mapPlugId: IOOf<Dict<Dict<string>>>
    ): void {
      this._ensure()
      return this.__graph.explodeUnit(unitId, mapUnitId, mapMergeId, mapPlugId)
    }

    public addMerges = (merges: GraphMergesSpec): void => {
      this._ensure()
      return this.__graph.addMerges(merges)
    }

    public addMerge = (mergeSpec: GraphMergeSpec, mergeId: string): void => {
      this._ensure()
      return this.__graph.addMerge(mergeSpec, mergeId)
    }

    public addPinToMerge = (
      mergeId: string,
      unitId: string,
      type: IO,
      pinId: string
    ): void => {
      this._ensure()
      return this.__graph.addPinToMerge(mergeId, unitId, type, pinId)
    }

    public removeMerge(mergeId: string): void {
      this._ensure()
      return this.__graph.removeMerge(mergeId)
    }

    public removePinFromMerge(
      mergeId: string,
      unitId: string,
      type: IO,
      pinId: string
    ) {
      this._ensure()
      return this.__graph.removePinFromMerge(mergeId, unitId, type, pinId)
    }

    public isPinMergedTo(
      mergeId: string,
      unitId: string,
      type: IO,
      pinId: string
    ) {
      this._ensure()
      return this.__graph.isPinMergedTo(mergeId, unitId, type, pinId)
    }

    public setUnitPinConstant(
      unitId: string,
      type: IO,
      pinId: string,
      constant: boolean
    ) {
      this._ensure()
      return this.__graph.setUnitPinConstant(unitId, type, pinId, constant)
    }

    public setUnitInputConstant(
      unitId: string,
      pinId: string,
      constant: boolean
    ) {
      this._ensure()
      return this.__graph.setUnitInputConstant(unitId, pinId, constant)
    }

    public setUnitOutputConstant(
      unitId: string,
      pinId: string,
      constant: boolean
    ) {
      this._ensure()
      return this.__graph.setUnitOutputConstant(unitId, pinId, constant)
    }

    public setUnitInputIgnored(
      unitId: string,
      pinId: string,
      ignored: boolean
    ): void {
      this._ensure()
      return this.__graph.setUnitPinIgnored(unitId, 'input', pinId, ignored)
    }

    public setUnitOutputIgnored(
      unitId: string,
      pinId: string,
      ignored: boolean
    ): void {
      this._ensure()
      return this.__graph.setUnitPinIgnored(unitId, 'output', pinId, ignored)
    }

    public setUnitPinIgnored(
      unitId: string,
      type: IO,
      pinId: string,
      ignored: boolean
    ): void {
      this._ensure()
      return this.__graph.setUnitPinIgnored(unitId, type, pinId, ignored)
    }

    public setUnitPinData(unitId: string, type: IO, pinId: string, data: any) {
      this._ensure()
      return this.__graph.setUnitPinData(unitId, type, pinId, data)
    }

    public setUnitInputData(unitId: string, pinId: string, data: any): void {
      this._ensure()
      return this.__graph.setUnitInputData(unitId, pinId, data)
    }

    public setUnitOutputData(unitId: string, pinId: string, data: any): void {
      this._ensure()
      return this.__graph.setUnitOutputData(unitId, pinId, data)
    }

    public getGraphMergeInputData(): Dict<any> {
      this._ensure()
      return this.__graph.getGraphMergeInputData()
    }

    public setMetadata(path: string[], data: any): void {
      this._ensure()
      this.__graph.setMetadata(path, data)
    }

    public setGraphState(state: any): void {
      this._ensure()
      this.__graph.setGraphState(state)
    }
  }

  return Lazy
}
