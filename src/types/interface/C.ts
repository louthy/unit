import { Dict } from '../Dict'
import { UnitBundle } from '../UnitBundle'
import { UnitBundleSpec } from '../UnitBundleSpec'
import { Component_ } from './Component'

export type C_J = {}

export type C_EE = {
  append_child: [UnitBundleSpec, string[]]
  insert_child: [UnitBundleSpec, number, string[]]
  remove_child: [number, string[]]
  [remove_child_at: `remove_child_at_${number}`]: [number]
  append_parent_root: [string, string, string]
  append_parent_root_children: [string, string[], Dict<string>]
  register_parent_root: [Component_, string]
  unregister_parent_root: [Component_]
  register_root: [Component_]
  unregister_root: [Component_]
  append_parent_child: [Component_, string]
  remove_parent_child: [Component_]
  reorder_root: [Component_, number]
  reorder_parent_root: [Component_, number]
  call: [{ method: string; data: any[] }]
}

export interface C {
  registerRoot(component: Component_): void
  unregisterRoot(component: Component_): void
  reorderRoot(component: Component_, to: number): void
  registerParentRoot(component: Component_, slotName: string): void
  unregisterParentRoot(component: Component_): void
  reorderParentRoot(component: Component_, to: number): void
  appendParentChild(component: Component_, slotName: string): void
  removeParentChild(component: Component_): void
  appendChild(Class: UnitBundle<Component_>): number
  insertChild(Class: UnitBundle<Component_>, at: number): void
  pushChild(Class: UnitBundle<Component_>): number
  removeChild(at: number): Component_
  pullChild(at: number): Component_
  hasChild(at: number): boolean
  refChild(at: number): Component_
  refChildren(): Component_[]
  refSlot(slotName: string): Component_
}
