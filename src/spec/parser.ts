import { evaluateBundleStr, idFromUnitValue } from '../client/idFromUnitValue'
import { MethodNotImplementedError } from '../exception/MethodNotImplementedError'
import { INHERITANCE } from '../interface'
import { keys } from '../system/f/object/Keys/f'
import { PinsSpecBase, Specs } from '../types'
import { UnitBundleSpec } from '../types/UnitBundleSpec'
import { weakMerge } from '../types/weakMerge'
import { matchAllExc } from '../util/array'
import { clone } from '../util/object'
import { removeWhiteSpace } from '../util/string'
import { BOOLEAN_LITERAL_REGEX } from './regex/BOOLEAN_LITERAL'
import { IDENTIFIER_REGEX } from './regex/IDENTIFIER'
import { NUMBER_LITERAL_REGEX } from './regex/NUMBER_LITERAL'
import { STRING_LITERAL_REGEX } from './regex/STRING_LITERAL'

export enum TreeNodeType {
  Invalid = 'invalid',
  Null = 'null',
  Generic = 'generic',
  Identifier = 'identifier',
  Expression = 'expression',
  ArrayExpression = 'array expression',
  ObjectExpression = 'object expression',
  Or = 'or',
  And = 'and',
  Object = 'object',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Class = 'class',
  StringLiteral = 'string literal',
  BooleanLiteral = 'boolean literal',
  NumberLiteral = 'number literal',
  ObjectLiteral = 'object literal',
  ArrayLiteral = 'array literal',
  ClassLiteral = 'class literal',
  KeyValue = 'key value',
  Regex = 'regex',
  RegexLiteral = 'regex literal',
  Date = 'date',
  DateLiteral = 'date literal',
  Time = 'time',
  Unit = 'unit',
  Any = 'any',
  PropExpression = 'prop expression',
  ArithmeticExpression = 'arithmetic expression',
  Url = 'url',
}

export type TreeNode = {
  value: string
  type: TreeNodeType
  children: TreeNode[]
}

export const COMMA = ','
export const DOUBLE_QUOTE = '"'
export const SINGLE_QUOTE = "'"
export const OBJECT_OPEN = '{'
export const OBJECT_CLOSE = '}'
export const ARRAY_OPEN = '['
export const ARRAY_CLOSE = ']'

function trimSides(str: string): string {
  return str.substring(1, str.length - 1)
}

function _traverse(
  root: TreeNode,
  callback: (node: TreeNode, path: number[]) => void,
  path: number[] = []
): void {
  callback(root, path)
  root.children.forEach((child: TreeNode, index: number) =>
    _traverse(child, callback, [...path, index])
  )
}

function _printTree(tree: TreeNode): void {
  // console.log(JSON.stringify(tree, null, 2))
  _traverse(tree, (node: TreeNode, path: number[]) =>
    // eslint-disable-next-line no-console
    console.log(path, node.value)
  )
}

export function printTree(data: string): void {
  const tree = getTree(data)
  _printTree(tree)
}

export function isCompositeType(type: TreeNodeType): boolean {
  return (
    [
      TreeNodeType.Or,
      TreeNodeType.And,
      TreeNodeType.ArrayExpression,
      TreeNodeType.Expression,
      TreeNodeType.ObjectLiteral,
      TreeNodeType.ArrayLiteral,
      TreeNodeType.KeyValue,
      TreeNodeType.Class,
    ].indexOf(type) > -1
  )
}

export function isGeneric(type: string): boolean {
  return hasGeneric(type)
}

export function hasGeneric(type: string): boolean {
  const tree = getTree(type)
  return _hasGeneric(tree)
}

export function _isGeneric(tree: TreeNode): boolean {
  return _hasGeneric(tree)
}

export function _hasGeneric(tree: TreeNode): boolean {
  return (
    tree.type === TreeNodeType.Generic ||
    (isCompositeType(tree.type) && tree.children.some(_hasGeneric))
  )
}

function getObjLiteralKeyValueMap(tree: TreeNode): { [key: string]: TreeNode } {
  const keyValueMap = {}
  for (const keyValue of tree.children) {
    if (keyValue.type === TreeNodeType.KeyValue) {
      const keyTree = keyValue.children[0]
      let key: string
      const { value, type } = keyTree
      if (type === TreeNodeType.Identifier) {
        key = value
      } else {
        key = value.substr(1, value.length - 2)
      }
      keyValueMap[key] = keyValue.children[1]
    } else {
      keyValueMap[keyValue.value] = keyValue.value
    }
  }
  return keyValueMap
}

export function _isValueOfType(value: TreeNode, type: TreeNode): boolean {
  switch (type.type) {
    case TreeNodeType.Generic:
      return _isValidValue(value)
    case TreeNodeType.Identifier:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
      return value.type === type.type && value.value === type.value
    case TreeNodeType.ObjectLiteral: {
      const typeKeyValueMap = getObjLiteralKeyValueMap(type)
      const valueKeyValueMap = getObjLiteralKeyValueMap(value)

      for (const key in typeKeyValueMap) {
        if (
          !valueKeyValueMap[key] ||
          !_isValueOfType(valueKeyValueMap[key], typeKeyValueMap[key])
        ) {
          return false
        }
      }

      return value.type === TreeNodeType.ObjectLiteral
    }
    case TreeNodeType.ArrayLiteral:
      return (
        value.type === TreeNodeType.ArrayLiteral &&
        !value.children.some(
          (child, index) => !_isValueOfType(child, type.children[index])
        )
      )
    case TreeNodeType.Object:
      return value.type === TreeNodeType.ObjectLiteral
    case TreeNodeType.String:
      return value.type === TreeNodeType.StringLiteral
    case TreeNodeType.Number:
      return value.type === TreeNodeType.NumberLiteral
    case TreeNodeType.Boolean:
      return value.type === TreeNodeType.BooleanLiteral

    case TreeNodeType.Or:
      return type.children.some((child) => _isValueOfType(value, child))
    case TreeNodeType.And:
      return !type.children.some((child) => !_isValueOfType(value, child))
    case TreeNodeType.ArrayExpression:
      return (
        value.type === TreeNodeType.ArrayLiteral &&
        !value.children.some(
          (child) => !_isValueOfType(child, type.children[0])
        )
      )
    case TreeNodeType.ObjectExpression:
      return (
        value.type === TreeNodeType.ObjectLiteral &&
        !value.children.some(
          (child) => !_isValueOfType(child, type.children[0])
        )
      )
    case TreeNodeType.Expression:
      return _isValueOfType(value, type.children[0])
    case TreeNodeType.KeyValue:
      return (
        _isValueOfType(value.children[0], type.children[0]) &&
        _isValueOfType(value.children[1], type.children[1])
      )
    default:
      throw new Error('not a valid TreeNodeType')
  }
}

export function isValueOfType(value: string, type: string) {
  const valueTree = getTree(value)
  const typeTree = getTree(type)

  if (!_isValidValue(valueTree)) {
    return false
  }

  if (!_isValidType(typeTree)) {
    return false
  }

  return _isValueOfType(valueTree, typeTree)
}

export function isValidType(type: string): boolean {
  const tree = getTree(type)
  return _isValidType(tree)
}

export function getTreeNodeType(value: string): TreeNodeType {
  const tree = getTree(value)
  return tree.type
}

export function isLiteralType(type: TreeNodeType): boolean {
  return !!LITERAL_TO_TYPE[type]
}

const LITERAL_TO_TYPE: { [type: string]: TreeNodeType } = {
  [TreeNodeType.NumberLiteral]: TreeNodeType.Number,
  [TreeNodeType.StringLiteral]: TreeNodeType.String,
  [TreeNodeType.BooleanLiteral]: TreeNodeType.Boolean,
  [TreeNodeType.RegexLiteral]: TreeNodeType.Regex,
  [TreeNodeType.DateLiteral]: TreeNodeType.Date,
}

const TYPE_TO_LITERAL: { [type: string]: TreeNodeType } = {
  [TreeNodeType.Number]: TreeNodeType.NumberLiteral,
  [TreeNodeType.String]: TreeNodeType.StringLiteral,
  [TreeNodeType.Boolean]: TreeNodeType.BooleanLiteral,
  [TreeNodeType.Object]: TreeNodeType.ObjectLiteral,
  [TreeNodeType.ArrayExpression]: TreeNodeType.ArrayLiteral,
  [TreeNodeType.Regex]: TreeNodeType.RegexLiteral,
  [TreeNodeType.Date]: TreeNodeType.DateLiteral,
}

export function getLiteralType(type: TreeNodeType): TreeNodeType {
  return TYPE_TO_LITERAL[type]
}

export const checkClassInheritance = (
  sourceClass: string,
  targetClass: string
) => {
  if (sourceClass === targetClass) {
    return true
  }

  const parentClasses = INHERITANCE[sourceClass]

  if (parentClasses) {
    return parentClasses.some((parentClass) =>
      checkClassInheritance(parentClass, targetClass)
    )
  }

  return false
}

export function _isTypeMatch(
  specs: Specs,
  source: TreeNode,
  target: TreeNode
): boolean {
  if (source.type === TreeNodeType.Invalid) {
    return false
  }

  if (source.type === TreeNodeType.Identifier) {
    return false
  }

  if (source.type === TreeNodeType.Any) {
    return true
  }

  if (source.type === TreeNodeType.Generic) {
    return true
  }

  if (source.type === TreeNodeType.Or) {
    return !source.children.some((sourceChild) => {
      return !_isTypeMatch(specs, sourceChild, target)
    })
  }

  if (source.type === TreeNodeType.And) {
    if (target.type === TreeNodeType.And) {
      return target.children.every((targetChild) => {
        return source.children.some((sourceChild) => {
          const typeMatch = _isTypeMatch(specs, sourceChild, targetChild)

          return typeMatch
        })
      })
    } else {
      return source.children.some((sourceChild) => {
        return _isTypeMatch(specs, sourceChild, target)
      })
    }
  }

  if (source.type === TreeNodeType.Expression) {
    return _isTypeMatch(specs, source.children[0], target)
  }

  switch (target.type) {
    case TreeNodeType.Invalid:
      return false
    case TreeNodeType.Identifier:
      return false
    case TreeNodeType.Any:
      return true
    case TreeNodeType.Generic:
      return true
    case TreeNodeType.String:
      return (
        source.type === TreeNodeType.String ||
        source.type === TreeNodeType.StringLiteral
      )
    case TreeNodeType.Number:
      return (
        source.type === TreeNodeType.Number ||
        source.type === TreeNodeType.NumberLiteral
      )
    case TreeNodeType.Boolean:
      return (
        source.type === TreeNodeType.Boolean ||
        source.type === TreeNodeType.BooleanLiteral
      )
    case TreeNodeType.Object:
      return (
        source.type === TreeNodeType.Object ||
        (source.type === TreeNodeType.ObjectLiteral && _isValidTree(source))
      )
    case TreeNodeType.Regex:
      return (
        source.type === TreeNodeType.Regex ||
        source.type === TreeNodeType.RegexLiteral
      )
    case TreeNodeType.Class:
      if (source.type === TreeNodeType.Class) {
        const sourceClass = source.value.slice(1, -1)
        const targetClass = target.value.slice(1, -1)

        const match = checkClassInheritance(sourceClass, targetClass)

        return match
      } else if (source.type === TreeNodeType.Unit) {
        const bundle = evaluateBundleStr(
          source.value,
          specs,
          {}
        ) as UnitBundleSpec

        const specId = bundle.unit.id

        const _specs = weakMerge(specs, bundle.specs ?? {})

        const spec = _specs[specId]

        const { type = '`U`&`C`&`G`' } = spec
        const typeTree = getTree(type)

        return _isTypeMatch(specs, typeTree, target)
      } else {
        return false
      }
    case TreeNodeType.Null:
      return source.type === TreeNodeType.Null
    case TreeNodeType.Unit:
      return source.type === TreeNodeType.Unit
    case TreeNodeType.ArithmeticExpression:
      return source.type === TreeNodeType.ArithmeticExpression
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.StringLiteral:
      return (
        source.type === target.type &&
        source.value.substr(1, source.value.length - 2) ===
          target.value.substr(1, target.value.length - 2)
      )
    case TreeNodeType.ObjectLiteral:
      if (source.type === TreeNodeType.Object) {
        return true
      } else if (source.type === TreeNodeType.ObjectLiteral) {
        const sourceDict = getObjLiteralKeyValueMap(source)
        const targetDict = getObjLiteralKeyValueMap(target)
        for (const targetKey in targetDict) {
          const sourceValue = sourceDict[targetKey]
          const targetValue = targetDict[targetKey]
          if (targetKey.endsWith('?')) {
            if (
              sourceValue !== undefined &&
              !_isTypeMatch(specs, sourceValue, targetValue)
            ) {
              return false
            }
          } else if (
            sourceValue === undefined ||
            !_isTypeMatch(specs, sourceValue, targetValue)
          ) {
            return false
          }
        }
        return true
      } else {
        return false
      }
    case TreeNodeType.ArrayLiteral:
      if (source.type !== TreeNodeType.ArrayLiteral) {
        return false
      }
      for (let i = 0; i < target.children.length; i++) {
        const targetChild = target.children[i]
        const sourceChild = source.children[i]
        if (!sourceChild || !_isTypeMatch(specs, sourceChild, targetChild)) {
          return false
        }
      }
      return true
    case TreeNodeType.Or:
      return target.children.some((targetChild) =>
        _isTypeMatch(specs, source, targetChild)
      )
    case TreeNodeType.And:
      return !target.children.some(
        (targetChild) => !_isTypeMatch(specs, source, targetChild)
      )
    case TreeNodeType.Expression:
      return _isTypeMatch(specs, source, target.children[0])
    case TreeNodeType.ArrayExpression:
      return (
        (source.type === TreeNodeType.ArrayExpression &&
          _isTypeMatch(specs, source.children[0], target.children[0])) ||
        (source.type === TreeNodeType.ArrayLiteral &&
          (source.children.length === 0 ||
            !source.children.some(
              (c) => !_isTypeMatch(specs, c, target.children[0])
            )))
      )
    case TreeNodeType.ObjectExpression:
      return (
        (source.type === TreeNodeType.ObjectExpression &&
          _isTypeMatch(specs, source.children[0], target.children[0])) ||
        (source.type === TreeNodeType.ObjectLiteral &&
          (source.children.length === 0 ||
            !source.children.some(
              (keyValue) =>
                !_isTypeMatch(specs, keyValue.children[1], target.children[0])
            )))
      )
  }

  return false
}

export function isTypeMatch(
  specs: Specs,
  source: string,
  target: string
): boolean {
  const sourceTree = getTree(source)
  const targetTree = getTree(target)

  return _isTypeMatch(specs, sourceTree, targetTree)
}

export function _isValidTree(value: TreeNode): boolean {
  return _isValidType(value) || _isValidValue(value)
}

export function isValidTree(value: string): boolean {
  const tree = getTree(value)

  return _isValidType(tree) || _isValidValue(tree)
}

export function _isValidValue(tree: TreeNode): boolean {
  switch (tree.type) {
    case TreeNodeType.Invalid:
    case TreeNodeType.Generic:
    case TreeNodeType.Identifier:
    case TreeNodeType.String:
    case TreeNodeType.Number:
    case TreeNodeType.Boolean:
    case TreeNodeType.Object:
    case TreeNodeType.Or:
    case TreeNodeType.And:
    case TreeNodeType.ArrayExpression:
    case TreeNodeType.ObjectExpression:
    case TreeNodeType.Expression:
    case TreeNodeType.KeyValue:
      return false
    case TreeNodeType.Null:
    case TreeNodeType.Unit:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.RegexLiteral:
    case TreeNodeType.DateLiteral:
    case TreeNodeType.ClassLiteral:
    case TreeNodeType.ArithmeticExpression:
      return true
    case TreeNodeType.ObjectLiteral:
      return !tree.children.some((element, index) => {
        if (element.type === TreeNodeType.KeyValue) {
          const {
            children: [key_tree, value_tree],
          } = element

          if (!key_tree) {
            return true
          }

          if (key_tree.value === '') {
            return true
          }

          if (!_isValidObjKeyType(key_tree)) {
            return true
          }

          if (value_tree.value !== '' && !_isValidValue(value_tree)) {
            return true
          }

          return false
        } else if (_isValidObjKeyType(element)) {
          return false
        } else if (element.value === '' && index === tree.children.length - 1) {
          return false
        }

        return true
      })
    case TreeNodeType.ArrayLiteral:
      return !tree.children.some((element, index) => {
        if (
          !_isValidValue(element) &&
          (element.value !== '' || index !== tree.children.length - 1)
        ) {
          return true
        }

        return false
      })
    default:
      return false
  }
}

export function _isValidType(tree: TreeNode): boolean {
  switch (tree.type) {
    case TreeNodeType.Invalid:
    case TreeNodeType.Identifier:
    case TreeNodeType.KeyValue:
      return false
    case TreeNodeType.Generic:
    case TreeNodeType.String:
    case TreeNodeType.Number:
    case TreeNodeType.Regex:
    case TreeNodeType.Date:
    case TreeNodeType.Boolean:
    case TreeNodeType.Object:
    case TreeNodeType.Null:
    case TreeNodeType.Class:
    case TreeNodeType.Any:
    case TreeNodeType.Unit:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.RegexLiteral:
    case TreeNodeType.DateLiteral:
    case TreeNodeType.ClassLiteral:
    case TreeNodeType.ArithmeticExpression:
      return true
    case TreeNodeType.ArrayExpression:
    case TreeNodeType.ObjectExpression:
    case TreeNodeType.PropExpression:
    case TreeNodeType.Expression:
    case TreeNodeType.Or:
    case TreeNodeType.And:
      return !tree.children.some((child) => !_isValidType(child))
    case TreeNodeType.ObjectLiteral:
      return !tree.children.some((element, index) => {
        if (element.type === TreeNodeType.KeyValue) {
          const {
            children: [key, value],
          } = element

          if (key.value === '') {
            return true
          }

          return (
            (!key ||
              !_isValidObjKeyType(key) ||
              !value ||
              !_isValidType(value)) &&
            (element.value !== '' || index !== tree.children.length - 1)
          )
        } else if (_isValidObjKeyType(element) || element.value === '') {
          return false
        }

        return true
      })
    case TreeNodeType.ArrayLiteral:
      return !tree.children.some(
        (element, index) =>
          !_isValidType(element) &&
          (element.value !== '' || index !== tree.children.length - 1)
      )
    default:
      return false
  }
}

export function isValidValue(value: string): boolean {
  const tree = getTree(value)

  return _isValidValue(tree)
}

function _isValidObjValueType(type: TreeNodeType): boolean {
  return type !== TreeNodeType.Identifier
}

export function isValidObjValue(type: string): boolean {
  const tree = getTree(type)
  return _isValidObjValueType(tree.type)
}

export function _isValidObjKeyType(tree: TreeNode): boolean {
  return (
    tree.type === TreeNodeType.Generic ||
    tree.type === TreeNodeType.Identifier ||
    tree.type === TreeNodeType.StringLiteral ||
    tree.type === TreeNodeType.BooleanLiteral ||
    tree.type === TreeNodeType.NumberLiteral
  )
}

export function isValidObjKey(key: string): boolean {
  const tree = getTree(key)

  return _isValidObjKeyType(tree)
}

export function _isKey(root: TreeNode, path: number[]): boolean {
  const parent = _getParent(root, path)

  return !!(
    parent &&
    parent.type === TreeNodeType.KeyValue &&
    path[path.length - 1] === 0
  )
}

export function isKey(root: string, path: number[]): boolean {
  const tree = getTree(root)
  return _isKey(tree, path)
}

export function isValidBooleanStr(str: string) {
  return BOOLEAN_LITERAL_REGEX.test(str)
}

export function isValidNumberStr(str: string) {
  return NUMBER_LITERAL_REGEX.test(str)
}

export function isValidStringStr(str: string) {
  return STRING_LITERAL_REGEX.test(str)
}

export function isValidIdentifierStr(str: string) {
  return IDENTIFIER_REGEX.test(str)
}

export function isValidKeyStr(str: string) {
  return (
    isValidBooleanStr(str) ||
    isValidNumberStr(str) ||
    isValidStringStr(str) ||
    isValidIdentifierStr(str)
  )
}

export function getTree(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false
): TreeNode {
  return (
    _getValueTree(value, keyValue, ignoreKeyword, getTree) ||
    _getTypeTree(value, keyValue, ignoreKeyword) || {
      value,
      type: TreeNodeType.Invalid,
      children: [],
    }
  )
}

export function _getTypeTree(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false
): TreeNode | undefined {
  // value = value.trim()

  if (!ignoreKeyword) {
    const classLiteralTest = /^\((.*)\)=>\((.*)\)$/.exec(value)
    if (classLiteralTest) {
      return {
        value,
        type: TreeNodeType.ClassLiteral,
        children: [],
      }
    }
  }

  const expressionTest = /^\((.+)\)$/.exec(value)
  if (expressionTest) {
    const children = [getTree(expressionTest[1])]
    return {
      value,
      type: TreeNodeType.Expression,
      children,
    }
  }

  const genericTest = /^<[^]*>$/.exec(value)
  if (genericTest) {
    return {
      value,
      type: TreeNodeType.Generic,
      children: [],
    }
  }

  if (!ignoreKeyword) {
    const regexTest = /^regex$/.exec(value)
    if (regexTest) {
      return REGEX_TREE
    }

    const stringTest = /^string$/.exec(value)

    if (stringTest) {
      return STRING_TREE
    }

    const numberTest = /^number$/.exec(value)
    if (numberTest) {
      return NUMBER_TREE
    }

    const booleanTest = /^boolean$/.exec(value)
    if (booleanTest) {
      return BOOLEAN_TREE
    }

    const objectTest = /^object$/.exec(value)
    if (objectTest) {
      return OBJECT_TREE
    }

    const anyTest = /^any$/.exec(value)
    if (anyTest) {
      return ANY_TREE
    }
  }

  const propExpressionTest = /^([^ [\]]+)(\[[^ [\]]+\]+)$/.exec(value)
  if (propExpressionTest) {
    const _ = getTree(propExpressionTest[1])
    const __ = getTree(propExpressionTest[2])
    const children = [_, __]
    return {
      value,
      type: TreeNodeType.PropExpression,
      children,
    }
  }

  const arrayExpressionTest = /^([^ ]+)\[\]$/.exec(value)
  if (arrayExpressionTest) {
    const child = getTree(arrayExpressionTest[1])

    if (child.type !== TreeNodeType.Invalid) {
      const children = [child]
      return {
        value,
        type: TreeNodeType.ArrayExpression,
        children,
      }
    }
  }

  const objectExpressionTest = /^([^|{}]+)\{\}$/.exec(value)
  if (objectExpressionTest) {
    const children = [getTree(objectExpressionTest[1])]
    return {
      value,
      type: TreeNodeType.ObjectExpression,
      children,
    }
  }

  const orTest = /^.+(\|.+)+$/.exec(value)
  if (orTest) {
    const children = _getDelimiterSeparated(value, false, false, '|', getTree)
    return {
      value,
      type: TreeNodeType.Or,
      children,
    }
  }

  const andTest = /^(.+)&(.+)$/.exec(value)
  if (andTest) {
    const children = _getDelimiterSeparated(value, false, false, '&', getTree)
    return {
      value,
      type: TreeNodeType.And,
      children,
    }
  }

  const classTest = /^`([A-Z]+)(.*)?`$/i.exec(value)
  if (classTest) {
    const childStr = classTest[2]
    return {
      value,
      type: TreeNodeType.Class,
      children: childStr ? [getTree(childStr)] : [],
    }
  }

  return undefined
}

export function getValueTree(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false,
  _getTree: (
    value: string,
    keyValue?: boolean,
    ignoreKeyword?: boolean
  ) => TreeNode = _getValueTree
): TreeNode {
  return (
    _getValueTree(value, keyValue, ignoreKeyword, _getTree) || {
      value,
      type: TreeNodeType.Invalid,
      children: [],
    }
  )
}

const a = { foo: '"bar}' }

function execComposed(
  str: string,
  open_delimiter: string,
  close_delimiter: string
): [any, string] | null {
  const l = str.length

  if (str[0] === open_delimiter && str[l - 1] === close_delimiter) {
    let sq_open = false
    let dq_open = false
    let open = 0

    for (let i = 1; i < l - 1; i++) {
      const c = str[i]
      const pc = str[i - 1]

      if (c === "'" && pc !== '\\') {
        if (!dq_open) {
          sq_open = !sq_open
        }
      } else if (c === '"' && pc !== '\\') {
        if (!sq_open) {
          dq_open = !dq_open
        }
      } else {
        if (!sq_open && !dq_open) {
          if (c === open_delimiter) {
            open++
          } else if (c === close_delimiter) {
            open--

            if (open === -1) {
              return null
            }
          }
        }
      }
    }
    if (open > 0) {
      return null
    }
    return [str, str.substr(1, l - 2)]
  } else {
    return null
  }
}

function execObject(str: string): [any, string] | null {
  return execComposed(str, OBJECT_OPEN, OBJECT_CLOSE)
}

function execArray(str: string): [any, string] | null {
  return execComposed(str, ARRAY_OPEN, ARRAY_CLOSE)
}

function _getValueTree(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false,
  _getTree: (
    value: string,
    keyValue?: boolean,
    ignoreKeyword?: boolean
  ) => TreeNode = _getValueTree
): TreeNode | undefined {
  if (!ignoreKeyword) {
    const nullTest = /^null$/.exec(value)
    if (nullTest) {
      return NULL_TREE
    }

    const infinityTest = /^[+-]?Infinity$/.exec(value)
    if (infinityTest) {
      return {
        value,
        type: TreeNodeType.NumberLiteral,
        children: [],
      }
    }
  }

  const booleanLiteralTest = BOOLEAN_LITERAL_REGEX.exec(value)
  if (booleanLiteralTest) {
    return {
      value,
      type: TreeNodeType.BooleanLiteral,
      children: [],
    }
  }

  const stringLiteralTest = STRING_LITERAL_REGEX.exec(value)
  if (stringLiteralTest) {
    return {
      value,
      type: TreeNodeType.StringLiteral,
      children: [],
    }
  }

  const numberLiteralTest = NUMBER_LITERAL_REGEX.exec(value)
  if (numberLiteralTest) {
    return {
      value,
      type: TreeNodeType.NumberLiteral,
      children: [],
    }
  }

  const arithmeticExpressionTest =
    /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[\s]*[+\-*/][\s]*-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)+$/g.exec(
      value
    )
  if (arithmeticExpressionTest) {
    return {
      value,
      type: TreeNodeType.ArithmeticExpression,
      children: [],
    }
  }

  const unitTest = /^\$\{(.*)\}$/is.exec(value)
  if (unitTest) {
    return {
      value,
      type: TreeNodeType.Unit,
      children: [],
    }
  }

  const regexLiteralTest = /^\/.+\/$/.exec(value)
  if (regexLiteralTest) {
    return {
      value,
      type: TreeNodeType.RegexLiteral,
      children: [],
    }
  }

  // this check must come after keywords (null, string, etc.)
  if (ignoreKeyword) {
    const identifierTest = IDENTIFIER_REGEX.test(value)
    if (identifierTest) {
      return {
        value,
        type: TreeNodeType.Identifier,
        children: [],
      }
    }
  }

  if (keyValue) {
    const keyValueTest = /^("[^"]*"|'[^']*'|[^:{]*):([^]*)$/.exec(value)

    if (keyValueTest) {
      let k = _getTree(keyValueTest[1], false, true)

      if (!_isValidObjKeyType(k)) {
        k = {
          value: k.value,
          type: TreeNodeType.Invalid,
          children: [],
        }
      }

      const value_value = keyValueTest[2]

      const v = _getTree(value_value) || {
        value: value_value,
        type: TreeNodeType.Invalid,
        children: [],
      }

      const children = [k, v]

      return {
        value,
        type: TreeNodeType.KeyValue,
        children,
      }
    } else {
      return {
        value,
        type: TreeNodeType.Invalid,
        children: [],
      }
    }
  }

  const objectLiteralTest = execObject(value)
  if (objectLiteralTest) {
    const commaSeparated = objectLiteralTest[1]
    const children: TreeNode[] = _getCommaSeparated(
      commaSeparated,
      true,
      true,
      _getTree
    )
    return {
      value,
      type: TreeNodeType.ObjectLiteral,
      children,
    }
  }

  const arrayLiteralTest = execArray(value)
  if (arrayLiteralTest) {
    const commaSeparated = arrayLiteralTest[1]
    const children: TreeNode[] = _getCommaSeparated(
      commaSeparated,
      false,
      false,
      _getTree
    )
    return {
      value,
      type: TreeNodeType.ArrayLiteral,
      children,
    }
  }

  const urlTest = /^unit:\/\/.+$/i.exec(value)
  if (urlTest) {
    return {
      value,
      type: TreeNodeType.Url,
      children: [],
    }
  }

  return undefined
}

export function _extractGenerics(
  specs: Specs,
  value: TreeNode,
  type: TreeNode
): {
  [name: string]: string
} {
  let generics: {
    [name: string]: string
  } = {}

  switch (type.type) {
    case TreeNodeType.Generic: {
      const valueTypeTree = _getValueType(specs, value)
      const valueTypeTreeStr = _stringify(valueTypeTree)

      return { [type.value]: valueTypeTreeStr }
    }
    case TreeNodeType.Identifier:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.Object:
    case TreeNodeType.String:
    case TreeNodeType.Number:
    case TreeNodeType.Boolean:
    case TreeNodeType.Any:
    case TreeNodeType.ArithmeticExpression:
      break
    case TreeNodeType.ArrayLiteral:
    case TreeNodeType.ObjectLiteral: {
      const typeKeyValueMap = getObjLiteralKeyValueMap(type)
      const valueKeyValueMap = getObjLiteralKeyValueMap(value)
      for (const key in typeKeyValueMap) {
        const _key = key.endsWith('?') ? key.slice(0, -1) : key
        const childGenerics = _extractGenerics(
          specs,
          valueKeyValueMap[_key] ?? valueKeyValueMap[key],
          typeKeyValueMap[_key] ?? typeKeyValueMap[key]
        )
        for (const name in childGenerics) {
          const childGeneric = childGenerics[name]
          if (!generics[name]) {
            generics[name] = childGeneric
          } else if (generics[name] !== childGeneric) {
            throw `Found two possible types for generic ${name}: ${generics[name]} and ${childGeneric}`
          }
        }
      }
      break
    }
    case TreeNodeType.Or:
    case TreeNodeType.And:
      for (const child of type.children) {
        if (_hasGeneric(child)) {
          generics = {
            ...generics,
            ..._extractGenerics(specs, value, child),
          }
        }
      }
      break
    case TreeNodeType.ArrayExpression:
    case TreeNodeType.ObjectExpression:
      return _extractGenerics(
        specs,
        value.children[0] || ANY_TREE,
        type.children[0]
      )
    case TreeNodeType.Expression:
      // TODO
      break
    case TreeNodeType.KeyValue:
      return _extractGenerics(specs, value.children[1], type.children[1])
    case TreeNodeType.Class:
      if (
        value.type === TreeNodeType.Class ||
        value.type === TreeNodeType.ClassLiteral
      ) {
        const valueChild = value.children[0]
        const _valueTree = valueChild
          ? getTree(valueChild.value.substring(1, valueChild.value.length - 1))
          : ANY_TREE
        return _extractGenerics(specs, _valueTree, type.children[0] || ANY_TREE)
      } else {
        break
      }
  }

  return generics
}

export const NULL_TREE = {
  value: 'null',
  type: TreeNodeType.Null,
  children: [],
}

export const STRING_TREE = {
  value: 'string',
  type: TreeNodeType.String,
  children: [],
}

export const BOOLEAN_TREE = {
  value: 'boolean',
  type: TreeNodeType.Boolean,
  children: [],
}

export const NUMBER_TREE = {
  value: 'number',
  type: TreeNodeType.Number,
  children: [],
}

export const ANY_TREE = {
  value: 'any',
  type: TreeNodeType.Any,
  children: [],
}

export const REGEX_TREE = {
  value: 'regex',
  type: TreeNodeType.Regex,
  children: [],
}

export const OBJECT_TREE = {
  value: 'object',
  type: TreeNodeType.Object,
  children: [],
}

function basePinsSpecToParams(pins: PinsSpecBase): string {
  return keys(pins)
    .map((pinId) => {
      const { type } = pins[pinId]
      return `${removeWhiteSpace(pinId)}:${type}`
    })
    .join(',')
}

export function _getValueType(specs: Specs, tree: TreeNode): TreeNode {
  let children: TreeNode[] = []
  switch (tree.type) {
    case TreeNodeType.Invalid:
    case TreeNodeType.Null:
    case TreeNodeType.Identifier:
      return tree
    case TreeNodeType.StringLiteral:
      return STRING_TREE
    case TreeNodeType.BooleanLiteral:
      return BOOLEAN_TREE
    case TreeNodeType.NumberLiteral:
      return NUMBER_TREE
    case TreeNodeType.RegexLiteral:
      return REGEX_TREE
    case TreeNodeType.ClassLiteral: {
      const spec = specs[tree.value]

      return {
        value: `(${basePinsSpecToParams(spec.inputs)})=>(${basePinsSpecToParams(
          spec.outputs
        )})`,
        type: TreeNodeType.ClassLiteral,
        children: [],
      }
    }
    case TreeNodeType.ArrayLiteral: {
      const type =
        tree.children.length > 0
          ? _getValueType(specs, tree.children[0]) // AD HOC should consider all children
          : getTree('<T>')

      // : getTree('any')
      return {
        value: `${type.value}[]`,
        type: TreeNodeType.ArrayExpression,
        children: [type],
      }
    }
    case TreeNodeType.ObjectLiteral:
      children = tree.children.map((c) => _getValueType(specs, c))

      return {
        value: `{${children.map((c) => c.value).join(',')}}`,
        type: TreeNodeType.ObjectLiteral,
        children,
      }
    case TreeNodeType.KeyValue: {
      const key = tree.children[0]
      const value = _getValueType(specs, tree.children[1])

      children = [key, value]

      return {
        value: `${key.value}:${value.value}`,
        type: TreeNodeType.KeyValue,
        children,
      }
    }
    case TreeNodeType.Unit: {
      const { value } = tree

      const bundle = evaluateBundleStr(value, specs, {}) // TODO

      const specId = idFromUnitValue(value, specs, {}) // TODO

      const spec = specs[specId] || bundle.specs[specId]

      if (!spec) {
        throw new Error('Spec not found: ' + specId)
      }

      const { type = '`U`&`C`&`G`' } = spec

      return getTree(type)
    }
    default:
      return tree
  }
}

export function getValueType(specs: Specs, value: string): string {
  const valueTree = getTree(value)
  const typeTree = _getValueType(specs, valueTree)
  return typeTree.value
}

export function _stringify(tree: TreeNode): string {
  switch (tree.type) {
    case TreeNodeType.Invalid:
    case TreeNodeType.Null:
    case TreeNodeType.Generic:
    case TreeNodeType.Identifier:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.Object:
    case TreeNodeType.String:
    case TreeNodeType.Number:
    case TreeNodeType.Any:
    case TreeNodeType.Boolean:
      return tree.value
    case TreeNodeType.ArrayLiteral: {
      const children = tree.children

      return `[${children.map(_stringify).join(',')}]`
    }
    case TreeNodeType.ObjectLiteral:
      return `{${tree.children.map(_stringify).join(',')}}`
    case TreeNodeType.Or:
    case TreeNodeType.And:
      return tree.value
    case TreeNodeType.ArrayExpression:
      return `${tree.children[0].value}[]`
    case TreeNodeType.ObjectExpression:
      return `${tree.children[0].value}{}`
    case TreeNodeType.Expression:
      // TODO
      return ''
    case TreeNodeType.KeyValue:
      return `${_stringify(tree.children[0])}${
        (!!tree.children[1] && `:${_stringify(tree.children[1])}`) || ''
      }`
    default:
      return tree.value
  }
}

export function findGenerics(value: string): Set<string> {
  const tree = getTree(value)
  return _findGenerics(tree)
}

export function _findGenerics(tree: TreeNode): Set<string> {
  if (tree.type === TreeNodeType.Generic) {
    return new Set([tree.value])
  } else {
    return tree.children.reduce(
      (acc, c) => new Set([...acc, ..._findGenerics(c)]),
      new Set([])
    )
  }
}

export function extractGenerics(specs: Specs, value: string, type: string) {
  const valueTree = getTree(value)
  const typeTree = getTree(type)

  return _extractGenerics(specs, valueTree, typeTree)
}

export function _applyGenerics(
  tree: TreeNode,
  map: { [name: string]: string }
): TreeNode {
  switch (tree.type) {
    case TreeNodeType.Generic: {
      const replacement = map[tree.value]

      if (replacement) {
        const replacementTree = getTree(replacement)
        return {
          value: replacement,
          type: replacementTree.type,
          children: replacementTree.children,
        }
      } else {
        return tree
      }
    }
    case TreeNodeType.Invalid:
    case TreeNodeType.Identifier:
    case TreeNodeType.StringLiteral:
    case TreeNodeType.BooleanLiteral:
    case TreeNodeType.NumberLiteral:
    case TreeNodeType.Null:
    case TreeNodeType.Object:
    case TreeNodeType.Any:
    case TreeNodeType.String:
    case TreeNodeType.Unit:
    case TreeNodeType.Number:
    case TreeNodeType.Boolean:
      return tree
    case TreeNodeType.ObjectLiteral:
    case TreeNodeType.ArrayLiteral:
    case TreeNodeType.Or:
    case TreeNodeType.And:
    case TreeNodeType.ArrayExpression:
    case TreeNodeType.ObjectExpression:
    case TreeNodeType.Expression:
    case TreeNodeType.KeyValue:
    case TreeNodeType.ClassLiteral:
    case TreeNodeType.PropExpression: {
      const children = tree.children.map((child) => _applyGenerics(child, map))
      const value = tree.children.reduce((acc, child, i) => {
        return acc.replace(child.value, children[i].value)
      }, tree.value)
      return {
        ...tree,
        value,
        children,
      }
    }
    case TreeNodeType.Class: {
      const children = tree.children.map((child) => _applyGenerics(child, map))
      const value = tree.children.reduce((acc, child, i) => {
        const _child = children[i]
        return acc.replace(
          trimSides(child.value),
          _child.type === TreeNodeType.Generic
            ? trimSides(_child.value)
            : _child.value
        )
      }, tree.value)
      return {
        ...tree,
        value,
        children,
      }
    }
    default:
      throw new MethodNotImplementedError()
  }
}

export function applyGenerics(
  type: string,
  map: { [name: string]: string }
): string {
  const typeTree = getTree(type)
  const valueTree = _applyGenerics(typeTree, map)
  const { value } = valueTree
  return value
}

function _isEmtpyString(str: string): boolean {
  return !!/^ *$/.exec(str)
}

function _getDelimiterSeparated(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false,
  delimiter: string,
  _getTree: (
    value: string,
    keyValue?: boolean,
    ignoreKeyword?: boolean
  ) => TreeNode
): TreeNode[] {
  let objectOpenCount = 0
  let arrayOpenCount = 0
  let singleQuoteOpen = false
  let doubleQuoteOpen = false
  let pos = 0
  let lastStop = 0
  let pushNext = false

  const children: TreeNode[] = []

  let prevChar: string | undefined = undefined

  while (pos < value.length) {
    const char = value[pos]

    if (!doubleQuoteOpen && !singleQuoteOpen) {
      if (char === OBJECT_OPEN) {
        objectOpenCount++
      } else if (char === OBJECT_CLOSE) {
        objectOpenCount--
      }

      if (char === ARRAY_OPEN) {
        arrayOpenCount++
      } else if (char === ARRAY_CLOSE) {
        arrayOpenCount--
      }
    }

    if (!singleQuoteOpen) {
      if (char === DOUBLE_QUOTE && prevChar !== '\\') {
        doubleQuoteOpen = !doubleQuoteOpen
      }
    }

    if (!doubleQuoteOpen) {
      if (char === SINGLE_QUOTE && prevChar !== '\\') {
        singleQuoteOpen = !singleQuoteOpen
      }
    }

    if (
      char === delimiter &&
      objectOpenCount === 0 &&
      arrayOpenCount === 0 &&
      !singleQuoteOpen &&
      !doubleQuoteOpen
    ) {
      const childString = value.substring(lastStop, pos)

      if (_isEmtpyString(childString)) {
        break
      }

      children.push(_getTree(childString, keyValue, ignoreKeyword))
      lastStop = pos + 1
      pushNext = true
    }

    prevChar = char

    pos++
  }

  // push last element
  const lastChildString = value.substring(lastStop, value.length)

  if (!_isEmtpyString(lastChildString) || pushNext) {
    children.push(_getTree(lastChildString, keyValue, ignoreKeyword))
  }

  return children
}

function _getCommaSeparated(
  value: string,
  keyValue: boolean = false,
  ignoreKeyword: boolean = false,
  _getTree: (
    value: string,
    keyValue?: boolean,
    ignoreKeyword?: boolean
  ) => TreeNode
): TreeNode[] {
  return _getDelimiterSeparated(value, keyValue, ignoreKeyword, COMMA, _getTree)
}

export function _getNodeAtPath(
  root: TreeNode,
  path: number[]
): TreeNode | null {
  let cursor = root
  for (const key of path) {
    if (cursor) {
      cursor = cursor.children[key]
    } else {
      return null
    }
  }
  return cursor
}

export function getNodeAtPath(data: string, path: number[]): string | null {
  const tree = getTree(data)
  const node = _getNodeAtPath(tree, path)
  return (node && node.value) || null
}

export function _getNextNode(
  node: TreeNode,
  path: number[],
  direction: 1 | -1
): TreeNode | null {
  const nextNodePath = _getNextNodePath(node, path, direction)
  return nextNodePath && _getNodeAtPath(node, nextNodePath)
}

export function getNextNode(
  data: string,
  path: number[],
  direction: 1 | -1
): string | null {
  const tree = getTree(data)
  const nextNode = _getNextNode(tree, path, direction)
  return nextNode && nextNode.value
}

function _getNodePaths(root: TreeNode): number[][] {
  const paths: number[][] = []
  _traverse(root, (node, path) => {
    paths.push(path)
  })
  return paths
}

function _getNodesAndPaths(root: TreeNode): {
  node: TreeNode
  path: number[]
}[] {
  const paths: {
    node: TreeNode
    path: number[]
  }[] = []
  _traverse(root, (node, path) => {
    paths.push({ node, path })
  })
  return paths
}

function _pathEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

// TODO
// f([], []) === 0
// f([], [0]) === 1
// f([], [0]) === 1
// f([], [1]) === 2
// f([0], [1]) === 1
// f([1], [1]) === 0
// f([1], [1, 0]) === 1 (?)
// f([1], [1, 0, 0]) === 1 (?)
function pathDistance(a: number[], b: number[]): number {
  return 0
}

// Given a path and a direction, return the next path in preorder order traversal
// f("[0, 1, 2]", [1], 1) === [2]
// f("{ a: { b: "c" }, d: "f" }", [], 1) === [0]
// f("{ a: { b: "c" }, d: "f" }", [0, 1, 0, 1], 1) === [1]
export function _getNextNodePath(
  root: TreeNode,
  path: number[],
  direction: 1 | -1
): number[] | null {
  const paths = _getNodePaths(root)
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i]
    if (_pathEqual(path, p)) {
      return paths[i + direction]
    }
  }
  return null
}

export function getNextNodePath(
  data: string,
  path: number[],
  direction: 1 | -1
): number[] | null {
  const tree = getTree(data)
  return _getNextNodePath(tree, path, direction)
}

export function _getNextLeafPath(
  root: TreeNode,
  path: number[],
  direction: 1 | -1
): number[] | null {
  const nodesAndPaths = _getNodesAndPaths(root)
  for (let i = 0; i < nodesAndPaths.length; i++) {
    const { path: p } = nodesAndPaths[i]
    if (_pathEqual(path, p)) {
      for (
        let j = i + direction;
        j >= 0 && j < nodesAndPaths.length;
        j = j + direction
      ) {
        const { node, path: p } = nodesAndPaths[j]
        if (node.children.length === 0) {
          return p
        }
      }
    }
  }
  return null
}

export function getNextLeafPath(
  data: string,
  path: number[],
  direction: 1 | -1
): number[] | null {
  const tree = getTree(data)
  return _getNextLeafPath(tree, path, direction)
}

// TODO
export function _getNextSiblingPath(
  tree: TreeNode,
  path: number[],
  direction: 1 | -1
): number[] {
  return _getNextLeafPath(tree, path, direction)
}

// Here is an idea for the mechanics:
// 1) Arrow key right or left -> go right or left
// 2) Arrow down -> go lower level
// 3) Arrow up -> go uper level

export function getNextSiblingPath(
  value: string,
  path: number[],
  direction: 1 | -1
): number[] | null {
  const tree = getTree(value)
  return _getNextLeafPath(tree, path, direction)
}

export function getParentPath(path: number[]): number[] | null {
  if (path.length === 0) {
    return null
  }
  return path.slice(0, path.length - 1)
}

export function getParent(root: string, path: number[]): string | null {
  const tree = getTree(root)
  const parent = _getParent(tree, path)
  if (!parent) {
    return null
  }
  return parent.value
}

export function _getLastLeaf(root: TreeNode): TreeNode {
  let cursor = root
  while (cursor.children.length > 0) {
    const last_child = cursor.children[cursor.children.length - 1]
    cursor = last_child
  }
  return cursor
}

export function _getLastLeafPath(root: TreeNode): number[] {
  let path = []
  let cursor = root
  let l = cursor.children.length
  while (l > 0) {
    const last_child_index = l - 1
    path.push(last_child_index)
    const last_child = cursor.children[last_child_index]
    cursor = last_child
    l = cursor.children.length
  }
  return path
}

export function getLastLeafPath(root: string): number[] {
  const tree = getTree(root)
  const path = _getLastLeafPath(tree)
  return path
}

export function getLastLeaf(root: string): string {
  const tree = getTree(root)
  const last = _getLastLeaf(tree)
  const { value } = last
  return value
}

export function _getParent(root: TreeNode, path: number[]): TreeNode | null {
  const parentPath = getParentPath(path)
  if (!parentPath) {
    return null
  }
  return _getNodeAtPath(root, parentPath)
}

export function _insertNodeAt(
  root: TreeNode,
  path: number[],
  node: TreeNode
): TreeNode {
  if (path.length === 0) {
    return node
  }
  root = clone(root)

  const parentPath = getParentPath(path)!
  const parentNode = _getNodeAtPath(root, parentPath)!

  const last = path[path.length - 1]

  parentNode.children.splice(last, 0, node)

  let i = 0
  let n = root

  do {
    n.value = _stringify(n)
    n = n.children[path[i]]
    i++
  } while (i < path.length - 1)

  // TODO performance
  return getTree(root.value)
}

export function insertNodeAt(
  root: string,
  path: number[],
  node: string
): string {
  const rootTree = getTree(root)
  const nodeTree = getTree(node)
  const updatedRoot = _insertNodeAt(rootTree, path, nodeTree)
  return updatedRoot.value
}

export function _updateNodeAt(
  root: TreeNode,
  path: number[],
  update: TreeNode
): TreeNode {
  if (path.length === 0) {
    return update
  }

  root = clone(root)

  const parentPath = getParentPath(path)!
  const parentNode = _getNodeAtPath(root, parentPath)!

  const last = path[path.length - 1]

  parentNode.children[last] = update

  let i = 0
  let n = root

  do {
    n.value = _stringify(n)
    n = n.children[path[i]]
    i++
  } while (i < path.length - 1)

  // TODO performance
  return getTree(root.value)
}

export function updateNodeAt(
  root: string,
  path: number[],
  update: string
): string {
  const rootTree = getTree(root)
  const updateTree = getTree(update)
  const updatedRoot = _updateNodeAt(rootTree, path, updateTree)
  return updatedRoot.value
}

export const EMPTY_TREE = getTree('')

export function _removeNodeAt(root: TreeNode, path: number[]): TreeNode {
  if (path.length === 0) {
    return EMPTY_TREE
  }

  const parentPath = getParentPath(path)!
  const parentNode = _getNodeAtPath(root, parentPath)!
  const nodeIndex = path[path.length - 1]

  const updatedParentNode = clone(parentNode)

  updatedParentNode.children.splice(nodeIndex, 1)

  return _updateNodeAt(root, parentPath, getTree(_stringify(updatedParentNode)))
}

export function removeNodeAt(root: string, path: number[]) {
  const rootTree = getTree(root)
  const updatedRoot = _removeNodeAt(rootTree, path)
  return updatedRoot.value
}

export function _matchAllExcTypes(
  specs: Specs,
  a: TreeNode[],
  b: TreeNode[]
): [number, number][][] {
  return matchAllExc(a, b, (a, b) => _isTypeMatch(specs, a, b))
}

export function matchAllExcTypes(
  specs: Specs,
  a: string[],
  b: string[]
): [number, number][][] {
  return matchAllExc(a, b, (a, b) => isTypeMatch(specs, a, b))
}
