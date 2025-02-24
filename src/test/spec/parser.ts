import * as assert from 'assert'
import { evaluateBundleStr } from '../../client/idFromUnitValue'
import { evaluate } from '../../spec/evaluate'
import {
  applyGenerics,
  extractGenerics,
  findGenerics,
  getLastLeafPath,
  getNextLeafPath,
  getNextNode,
  getNextNodePath,
  getNodeAtPath,
  getParent,
  getTree,
  getTreeNodeType,
  getValueType,
  hasGeneric,
  insertNodeAt,
  isTypeMatch,
  isValidObjKey,
  isValidType,
  isValidValue,
  matchAllExcTypes,
  removeNodeAt,
  TreeNodeType,
  updateNodeAt,
} from '../../spec/parser'
import _classes from '../../system/_classes'
import { ID_IDENTITY } from '../../system/_ids'
import _specs from '../../system/_specs'
import isEqual from '../../system/f/comparisson/Equals/f'
import { system } from '../util/system'

const CUSTOM_GRAPH_UNIT_STR =
  '${unit:{id:"03972fcf-ab18-4f58-9ed0-b395f9589d0d"},specs:{"03972fcf-ab18-4f58-9ed0-b395f9589d0d":{type:"`U`&`G`&`C`",name:"untitled",units:{textbox:{id:"9988a56e-6bee-46c8-864c-e351d84bc7e2",input:{value:{constant:false},style:{constant:true,data:"{}"}},output:{div:{ignored:true}},metadata:{position:{x:-92,y:-281},component:{width:199.90983628557666,height:42.03120109148989}}},checkbox:{id:"096fc4ca-edd2-11ea-8266-37b634a3ee0b",input:{value:{ignored:true},style:{constant:true,data:"{width:\\\\"16px\\\\",height:\\\\"16px\\\\"}"},attr:{ignored:true}},output:{value:{}},metadata:{position:{x:237,y:-11}}},icon:{id:"63a417e5-d354-4b39-9ebd-05f55e70de7b",input:{style:{constant:true,data:"{width:\\\\"16px\\\\",height:\\\\"16px\\\\"}"},icon:{constant:true,data:"\\\\"x\\\\""}},output:{},metadata:{position:{x:229,y:-189}}},flexrow:{id:"ad5a2fcc-fdee-11ea-a34f-77e9c48dbe57",input:{style:{constant:true,data:"{gap:\\\\"12px\\\\"}"}},output:{},metadata:{position:{x:-112,y:-120}}}},merges:{},inputs:{value:{plug:{0:{unitId:"textbox",pinId:"value"}},type:"string"}},outputs:{},metadata:{icon:"question",description:""},render:true,component:{subComponents:{textbox:{children:[],childSlot:{}},checkbox:{children:[],childSlot:{}},icon:{children:[],childSlot:{}},flexrow:{children:[],childSlot:{}}},children:["checkbox","textbox","icon","flexrow"],defaultWidth:270,defaultHeight:180},id:"03972fcf-ab18-4f58-9ed0-b395f9589d0d"}}}'

// getTree

assert(getTree('{a:"1,2,3"}').children.length === 1)
assert(getTree("{a:'1,2,3'}").children.length === 1)
assert(getTree("{a:'(1,2,3)'}").children.length === 1)
assert(getTree('[true,true,]').children.length === 3)

assert(getTree('[true,true,]').children[2].value === '')
assert(
  getTree('{a:[true,true,]}').children[0].children[1].children[2].value === ''
)

// getTreeNodeType

assert.deepEqual(getTreeNodeType(':'), TreeNodeType.Invalid)
assert.deepEqual(getTreeNodeType('foo'), TreeNodeType.Invalid)
assert.deepEqual(getTreeNodeType('[1[]'), TreeNodeType.Invalid)
// assert.deepEqual(getTreeNodeType('a:'), TreeNodeType.KeyValue)
// assert.deepEqual(getTreeNodeType(':1'), TreeNodeType.KeyValue)
assert.deepEqual(getTreeNodeType('{a:}'), TreeNodeType.ObjectLiteral)
assert.deepEqual(getTreeNodeType('{:1}'), TreeNodeType.ObjectLiteral)
assert.deepEqual(getTreeNodeType('"a:b"'), TreeNodeType.StringLiteral)
assert.deepEqual(getTreeNodeType('"\\""'), TreeNodeType.StringLiteral)
assert.deepEqual(getTreeNodeType('"\r"'), TreeNodeType.StringLiteral)
assert.deepEqual(
  getTreeNodeType(
    `"v=0\r\no=- 7652727450078372599 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 61198 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 201.26.26.115\r\na=candidate:2612718301 1 udp 2122262783 2804:431:e7c2:b2f3:c94:df00:ed4f:6843 54465 typ host generation 0 network-id 2 network-cost 10\r\na=candidate:1333116113 1 udp 2122194687 192.168.15.5 61198 typ host generation 0 network-id 1 network-cost 10\r\na=candidate:3110454533 1 udp 1685987071 201.26.26.115 61198 typ srflx raddr 192.168.15.5 rport 61198 generation 0 network-id 1 network-cost 10\r\na=candidate:3577288237 1 tcp 1518283007 2804:431:e7c2:b2f3:c94:df00:ed4f:6843 9 typ host tcptype active generation 0 network-id 2 network-cost 10\r\na=candidate:32915489 1 tcp 1518214911 192.168.15.5 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r\na=ice-ufrag:YRMo\r\na=ice-pwd:Fwnv2ZDO0wzeeuDeWu+MVisV\r\na=fingerprint:sha-256 08:85:1D:A9:71:D2:CA:22:DD:76:E0:1D:59:CA:0E:E2:CA:93:3A:24:3B:09:28:F5:42:E5:D5:E7:79:C6:2B:E5\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"`
  ),
  TreeNodeType.StringLiteral
)
assert.deepEqual(getTreeNodeType('/abc/'), TreeNodeType.RegexLiteral)
assert.deepEqual(getTreeNodeType('null'), TreeNodeType.Null)
assert.deepEqual(getTreeNodeType('1+1'), TreeNodeType.ArithmeticExpression)
assert.deepEqual(getTreeNodeType('`U`'), TreeNodeType.Class)
assert.deepEqual(getTreeNodeType('`E`'), TreeNodeType.Class)
assert.deepEqual(getTreeNodeType('`V<T>`'), TreeNodeType.Class)
assert.deepEqual(getTreeNodeType('<T>[]'), TreeNodeType.ArrayExpression)
assert.deepEqual(getTreeNodeType('string[]'), TreeNodeType.ArrayExpression)
assert.deepEqual(getTreeNodeType("'string|number'"), TreeNodeType.StringLiteral)
assert.deepEqual(getTreeNodeType('(string)'), TreeNodeType.Expression)
assert.deepEqual(
  getTreeNodeType("'{a:number}&{b:string}'"),
  TreeNodeType.StringLiteral
)
assert.deepEqual(getTreeNodeType("'&*::&lt||()><'"), TreeNodeType.StringLiteral)
assert.deepEqual(
  getTreeNodeType(
    "'https://preview.redd.it/award_images/t5_22cerq/80j20o397jj41_NarwhalSalute.png?width=128&amp;height=128&amp;auto=webp&amp;s=5d2c75f44f176f430e936204f9a53b8a2957f2fc'"
  ),
  TreeNodeType.StringLiteral
)
assert.deepEqual(
  getTreeNodeType('(a:number,b:number)=>(a+b:number)'),
  TreeNodeType.ClassLiteral
)
assert.deepEqual(getTreeNodeType(`\${${ID_IDENTITY}}`), TreeNodeType.Unit)
assert.deepEqual(getTreeNodeType('string|number|{}'), TreeNodeType.Or)
assert.deepEqual(
  getTreeNodeType(
    'string|number|{filters?:(string|number|{name?:string,namePrefix?:string})[],optionalServices?:string[],acceptAllDevices?:boolean}'
  ),
  TreeNodeType.Or
)
assert.deepEqual(getTreeNodeType('<T>["S"]'), TreeNodeType.PropExpression)
assert.deepEqual(getTreeNodeType('unit://123'), TreeNodeType.Url)
assert.deepEqual(getTreeNodeType('{{}'), TreeNodeType.Invalid)

assert.deepEqual(getTree('{,}').children.length, 1)

// isValidType

assert(isValidType('/a/'))
assert(isValidType('regex'))
assert(isValidType('string'))
assert(isValidType('number'))
assert(isValidType('boolean'))
assert(isValidType('string[]'))
assert(isValidType('number[]'))
assert(isValidType('boolean[]'))
assert(isValidType('object[]'))
assert(isValidType('(string)'))
assert(isValidType('(1)'))
assert(isValidType('(string)[]'))
assert(isValidType('(string)[]'))
assert(isValidType('"foo"'))
assert(isValidType("'foo'"))
assert(isValidType('string|number'))
assert(isValidType('string|1'))
assert(isValidType('string|1|3'))
assert(isValidType('string&number'))
assert(isValidType('(string|number)[]'))
assert(isValidType('{number:1}'))
assert(isValidType('{}'))
assert(isValidType('[]'))
assert(isValidType('1+2'))
assert(isValidType('1 +2'))
assert(isValidType('1 + 2'))
assert(isValidType('{a:number,}'))
assert(isValidType('{foo:number}'))
assert(isValidType('{foo:number,bar:string}'))
assert(
  isValidType(
    '"click"|"mousedown"|"mouseup"|"mouseenter"|"mousemove"|"mouseleave"'
  )
)
assert(isValidType('{"foo":"number"}'))
assert(isValidType('{"foo":"number","bar":{"x":"number","y":"number"}}'))
assert(isValidType('{foo:number}[]'))
assert(isValidType('[]'))
assert(isValidType('[1,2,3]'))
assert(isValidType('[string,number]'))
assert(isValidType('3.14'))
assert(isValidType('<T>'))
assert(isValidType('`V<T>`'))
assert(isValidType('string[]'))
assert(isValidType('number[]'))
assert(isValidType('string[][]'))
assert(isValidType('string{}'))
assert(isValidType('string[]{}'))
assert(isValidType('[1,2,[3,4],5]'))
assert(isValidType('{name:string}|{namePrefix:string}'))
assert(isValidType('string[]|number[]'))
assert(isValidType('[]|[0,1,2]'))
assert(
  isValidType(
    '{headers:object,statusCode:number,statusMessage:string,data:string}'
  )
)
assert(isValidType('{"a":1,"b":true,"c":{"d":"string"}}'))
assert(isValidType('(()=>())'))
assert(isValidType('()=>()'))
assert(isValidType('(a:number)=>()'))
assert(isValidType('(a:number,b:number)=>(a+b:number)'))
assert(isValidType('any'))
assert(isValidType('<T>["S"]'))
assert(isValidType('<T>["S","A"]'))

assert(!isValidType("'foo's bar'"))
assert(!isValidType('{{}}'))
assert(!isValidType('{,}'))
assert(!isValidType(':'))
assert(!isValidType('b'))
assert(!isValidType("b'"))
assert(!isValidType("'''"))
assert(!isValidType('()'))
assert(!isValidType('{ foo }'))
assert(!isValidType('{ foo: bar }'))
assert(!isValidType('|'))
assert(!isValidType('string |'))
assert(!isValidType('string | foo'))
assert(!isValidType('foo'))
assert(!isValidType('foo: string'))
assert(!isValidType("{ a: b' }"))
assert(!isValidType('foo:true'))
assert(!isValidType('foo:false'))
assert(!isValidType('<T>["S",K]'))
assert(!isValidObjKey('*'))

const _isTypeMatch = (a: string, b: string) => isTypeMatch(system.specs, a, b)

assert(_isTypeMatch('number', 'number|string'))
assert(_isTypeMatch('string', 'number|string'))
assert(_isTypeMatch('number', '(number|string)'))
assert(_isTypeMatch('string', '(number|string)'))
assert(_isTypeMatch('number[]', '(number|string)[]'))
assert(_isTypeMatch('string[]', '(number|string)[]'))
assert(_isTypeMatch("'number|string'", 'string'))
assert(_isTypeMatch('"number|string"', 'string'))
assert(_isTypeMatch('"foo"', '"foo"|"bar"'))
assert(_isTypeMatch('{a:"foo"}', "{a:'foo'|'bar'}"))
assert(_isTypeMatch('[{a:"bar"}]', "{a:'foo'|'bar'}[]"))
assert(_isTypeMatch('<T>', '<G>'))
assert(_isTypeMatch('number', '<T>'))
assert(_isTypeMatch('<T>', 'number'))
assert(_isTypeMatch('<T>', 'string'))
assert(_isTypeMatch('<T>', 'string[]'))
assert(_isTypeMatch('<T>[]', 'string[]'))
assert(_isTypeMatch('[]', 'string[]'))
assert(_isTypeMatch('string', 'string'))
assert(_isTypeMatch('/abc/', 'regex'))
assert(_isTypeMatch('number', 'number'))
assert(_isTypeMatch('boolean', 'boolean'))
assert(_isTypeMatch('any', 'any'))
assert(_isTypeMatch('number', 'any'))
assert(_isTypeMatch('1', 'any'))
assert(_isTypeMatch('"foo"', 'string'))
assert(_isTypeMatch("'foo'", '"foo"'))
assert(_isTypeMatch('"foo"', '"foo"|"bar"'))
assert(_isTypeMatch('"foo"', "'foo'|'bar'"))
assert(_isTypeMatch("'foo'", "'foo'|'bar'"))
assert(_isTypeMatch('<T>', 'any'))
assert(_isTypeMatch('any', '<T>'))
assert(_isTypeMatch('null', 'null'))
assert(_isTypeMatch('null', 'any'))
assert(_isTypeMatch('string[]', '<T>[]'))
assert(_isTypeMatch('string[]', 'string[]'))
assert(_isTypeMatch('string[]', '(string|number)[]'))
assert(_isTypeMatch('{a:1,}', 'object'))
assert(_isTypeMatch('{"x":number,"y":number}', 'object'))
assert(_isTypeMatch('{x:0,y:1}', '{"x":number,"y":number}'))
assert(
  _isTypeMatch(
    '{x:10,y:10,width:100,height:100}',
    '{x:number,y:number,width:number,height:number}'
  )
)
assert(_isTypeMatch('{a:number,b:string}', '{a:number,b:string}'))
assert(_isTypeMatch('{a:number,b:string}', '{b:string,a:number}'))
assert(_isTypeMatch('{a:number,b:string}', '{a:number}'))
assert(_isTypeMatch('{a:number,b:string}', '{}'))
assert(_isTypeMatch('{a:"foo"}', "{a:'foo'}"))
assert(_isTypeMatch("{a:'foo'}", '{a:"foo"}'))
assert(_isTypeMatch('{type:"answer"}', "{type:'answer'}"))
assert(_isTypeMatch('{type:"answer",sdp:\'\'}', "{type:'answer',sdp:string}"))
assert(_isTypeMatch('{}', '{a?:number}'))
assert(_isTypeMatch('string[]&object', 'object'))
assert(_isTypeMatch('string[]&object', 'string[]'))
assert(_isTypeMatch('string[]&object', '<A>[]'))
assert(_isTypeMatch('string[]|object', 'string[]|object'))
assert(_isTypeMatch('string[]|{foo:"bar"}', 'string[]|object'))
assert(_isTypeMatch('[]', '[]'))
assert(_isTypeMatch('{a:"foo"}', 'string{}'))
assert(_isTypeMatch('{a:1}', 'number{}'))
assert(_isTypeMatch('[1,2,3]', '[1,2,3]'))
assert(_isTypeMatch('[1,2,3]', '[number,number,number]'))
assert(_isTypeMatch('any', 'number'))
assert(_isTypeMatch('<T>', '<K>[]'))
assert(_isTypeMatch('any', 'object'))
assert(_isTypeMatch('object', '{}'))
assert(_isTypeMatch('object', '{"x":number,"y":number}'))
assert(_isTypeMatch('<T>', ID_IDENTITY))
assert(_isTypeMatch('any', ID_IDENTITY))
assert(_isTypeMatch(`\${${ID_IDENTITY}}`, 'any'))
assert(_isTypeMatch('`G`', '`G`'))
assert(_isTypeMatch('`U`&`G`', '`G`'))
assert(_isTypeMatch('`U`&`G`', '`U`&`G`'))
assert(_isTypeMatch('`U`&`C`&`G`', '`U`&`G`'))
assert(_isTypeMatch('`U`&`G`', '`G`&`U`'))
assert(_isTypeMatch('`G`', '`EE`'))
assert(_isTypeMatch('`G`', '`U`'))
assert(_isTypeMatch(`\${unit:{id:'${ID_IDENTITY}'}}`, '`U`'))
assert(_isTypeMatch(CUSTOM_GRAPH_UNIT_STR, '`G`'))
assert(_isTypeMatch(CUSTOM_GRAPH_UNIT_STR, '`G`&`U`'))
assert(_isTypeMatch(CUSTOM_GRAPH_UNIT_STR, '`U`&`G`'))

assert(!_isTypeMatch('', 'any'))
assert(!_isTypeMatch('abc', 'any'))
assert(!_isTypeMatch('', '<T>'))
assert(!_isTypeMatch('1', '<T>[]'))
assert(!_isTypeMatch('foo', 'string'))
assert(!_isTypeMatch('regex', '/abc/'))
assert(!_isTypeMatch('foo', '<T>'))
assert(!_isTypeMatch('(string|number)[]', 'string[]'))
assert(!_isTypeMatch('string[]|object', '<A>[]'))
assert(!_isTypeMatch('[]', '[1]'))
assert(!_isTypeMatch('[1,2,3]', '[1,2,3,4]'))
assert(!_isTypeMatch('[1,2,3]', '[number,number, string]'))
assert(!_isTypeMatch('{background: "color"}', 'object'))
assert(!_isTypeMatch('null', ID_IDENTITY))
assert(!_isTypeMatch('object', 'class'))
assert(!_isTypeMatch('number', 'class'))
assert(!_isTypeMatch('number', ID_IDENTITY))
assert(!_isTypeMatch(ID_IDENTITY, 'number'))
assert(!_isTypeMatch('`U`', '`G`'))
assert(!_isTypeMatch('`U`', '`G`&`U`'))
assert(!_isTypeMatch('`U`&`C`', '`U`&`G`'))
assert(!_isTypeMatch('`U`&`C`&`V`&`J`', '`G`'))
assert(!_isTypeMatch('`U`&`G`', '`U`&`C`&`G`'))

// isValidValue

assert(isValidValue('null'))
assert(isValidValue('"foo"'))
assert(isValidValue("'\\\\'"))
assert(isValidValue('"\'foo\'"'))
assert(isValidValue("'\\'foo\\''"))
assert(isValidValue('"\\\'foo\\\'"'))
assert(isValidValue('"\\"foo\\""'))
assert(isValidValue('"\\"foo\\""'))
assert(isValidValue('"\\"\\\\"foo\\\\"\\""'))
assert(isValidValue('"\\"\\\\"\\\\\\"foo\\\\\\"\\\\"\\""'))
// assert(!isValidValue('"\\"\\\\"\\\\"foo\\\\\\"\\\\"\\""')) // TODO
assert(isValidValue('"foo   "'))
assert(isValidValue('"\t"'))
assert(isValidValue('"\n"'))
assert(isValidValue('"web+unit://ioun.it"'))
assert(isValidValue('"foo\nbar"'))
assert(isValidValue('3.14'))
assert(isValidValue('1'))
assert(isValidValue('1.'))
assert(isValidValue('Infinity'))
assert(isValidValue('-Infinity'))
assert(isValidValue('/abc/'))
assert(isValidValue('true'))
assert(isValidValue('[1,2,3]'))
assert(isValidValue('[1,2,3,]')) // trailing comma
assert(isValidValue('[[1,0],[0,1]]'))
assert(isValidValue('{a}'))
assert(isValidValue('{a,}'))
assert(isValidValue('{a:1,}'))
assert(isValidValue('{a:}'))
assert(isValidValue('{foo,bar}'))
assert(isValidValue('{a,b,c}'))
assert(isValidValue('{a,b,}'))
assert(isValidValue('{1,2}'))
assert(isValidValue('{1,2,}'))
assert(isValidValue('[{a},{1,2,}]'))
assert(isValidValue('{foo:"bar"}'))
assert(isValidValue('{number:1}'))
assert(isValidValue('{class:1}'))
assert(isValidValue('{foo:"bar",}')) // trailing comma
assert(isValidValue("{Ç:'Ç'}"))
assert(isValidValue(JSON.stringify(["", "\""]))) // prettier-ignore
assert(isValidValue('1e23'))
assert(isValidValue('{foo?:"bar"}'))
assert(isValidValue("{'{}':1}"))
assert(isValidValue("{'{':1}"))
assert(isValidValue('{"{}":1}'))
assert(isValidValue("{':':1}"))
assert(isValidValue('{":":1}'))
assert(
  isValidValue(
    `"v=0\r\no=- 7652727450078372599 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 61198 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 201.26.26.115\r\na=candidate:2612718301 1 udp 2122262783 2804:431:e7c2:b2f3:c94:df00:ed4f:6843 54465 typ host generation 0 network-id 2 network-cost 10\r\na=candidate:1333116113 1 udp 2122194687 192.168.15.5 61198 typ host generation 0 network-id 1 network-cost 10\r\na=candidate:3110454533 1 udp 1685987071 201.26.26.115 61198 typ srflx raddr 192.168.15.5 rport 61198 generation 0 network-id 1 network-cost 10\r\na=candidate:3577288237 1 tcp 1518283007 2804:431:e7c2:b2f3:c94:df00:ed4f:6843 9 typ host tcptype active generation 0 network-id 2 network-cost 10\r\na=candidate:32915489 1 tcp 1518214911 192.168.15.5 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r\na=ice-ufrag:YRMo\r\na=ice-pwd:Fwnv2ZDO0wzeeuDeWu+MVisV\r\na=fingerprint:sha-256 08:85:1D:A9:71:D2:CA:22:DD:76:E0:1D:59:CA:0E:E2:CA:93:3A:24:3B:09:28:F5:42:E5:D5:E7:79:C6:2B:E5\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"`
  )
)
assert(
  isValidValue(
    JSON.stringify({
      name: 'Samuel Moreira Timbó',
      birthday: '06/17/1992',
      phone: '+55 11 986918999',
      address:
        'R. Ana Rosa, 48 - Jardim Bela Vista, São José dos Campos - SP, 12209-050',
    })
  )
)
assert(
  isValidValue(
    `'{"error":{"errors":[{"domain":"global","reason":"required","message":"Login Required","locationType":"header","location":"Authorization"}],"code":401,"message":"Login Required"}}'`
  )
)
assert(
  isValidValue(
    `'{ "error": {  "errors": [   {    "domain": "global",    "reason": "required",    "message": "Login Required",    "locationType": "header",    "location": "Authorization"   }  ],  "code": 401,  "message": "Login Required" }}'`
  )
)
assert(
  isValidValue(
    '"(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*)@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])).){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])"'
  )
)
// assert(isValidValue('\\frac{1}{2+1}'))
assert(isValidValue(`\${${ID_IDENTITY}}`))
assert(isValidValue('1+2'))
assert(isValidValue('1 +2'))
assert(isValidValue('1 + 2'))
assert(isValidValue('1 + 2 * 3'))
assert(isValidValue('1 + 2 + 3 / 42'))
assert(isValidValue('{foo:"\\"bar}"}'))
assert(
  isValidValue(
    '{status:200,body:"�PNG\n\u001a\n\u0000\u0000\u0000IHDR\u0000\u0000\u0000�\u0000\u0000\u0000�\b\u0006\u0000\u0000\u0000R�l\u0007\u0000\u0000\u0000\tpHYs\u0000\u0000\u0005�\u0000\u0000\u0005�\u0001mh��\u0000\u0000\f�IDATx���{pTW\u001d\u0007��&�T�\\"\\"3v\u0006R���Ne�U��f#Z\u0015l������*�\f��AD\u000b�ݶB\u0015����Ђ&�-\u0015m5��ZE��h�*�\u001d[��\u0012f�\f\\"�\u0014\u001b��{����p�ϻ��q�=��\f#��vw��{�q\u001f\u0001Ƙ\u0006��h�\u0016�4-��e\u0011ӿ����@���n��=�����\u0019*�\u0000�.���t�>�\u0000\u000f\u0004��\u0004�{�G�EJ\b@q\u0011ӟr��nK�Pt�S\u0014�\u0000d\u000b�o�����@t�0�C� \u0000�裼����\u001c���Ё0�\u001d�\u0006M�Z\u0015)�|�0$�\u001cB9�\u0005 �\u000b�\n�\u0000�G$�<\b]|�I\t�\u0004���q^�^���b�� �BW�{\u0000\\"�l�X��\\"�\u0003�+�v%ɯ\u0001��3�_Vq��俧�P%�g�S�\u001f�#(~[5�ߴ;c�[z~\t\u0000\n�\u001d�\u000b��C Ƙ1�]&��QQ\'���@@�ɲ�\u0001`���\u0004\u0017�:ޢU�D \u0010����\u000b\u0000c,�w1Uݼ\u0012\u0015m�E\u0003��T\u0013ei�\u0000��\u0010c,�Ǡ(~��19Bǈ��,\u001fZ�\u000e���t��\u0006�w\u0000���4�D���v\u0000�X���q͎�zy7\u0010��S!;\u0000c,�ךQ��c�͏�p��\u0000��S�\\+�G\u0001��UUU����\n\u0013\u0000]�C�*D���\u001b]W�RUU%�%�B\f�t]\u000f�P��GǸ�\u001fs�y�\u0001t]��3?vt�B;ȑ��*O\'Ǟv\u0000]ף|�\u0013ů\u001e:��xxƳ\u000e�J�苷+{��,V]]���/�I\u0007@�C�v^\u0013�s�\u0003�R�\u000e\\�\fytVWW�\u001a\u0004W;\u0000�\u001f�X�k�5�u���1\f{��X0\u0018t%\b�t\u0000\u0014?���׌�\u001c\u000f\u0000�\u001f��J\b\u001c\u001d\u0002���E�:?@�\u001a���c�e�\u0005`tt4̯��&\u0017T\\"�c\\SS�H\b\u001c\t���h�_ۃ�X�\u000et�Y�����\u000b蜚\u0003t���FsyM���\u000e022����)m�����O`k\u0000FFF��\u0003N����ڶG`[\u0000F��1�\u00057�\'ŵS��2)�-\u0000���=��\u0017\\�;e�\u0014[n��e\u0012<<<�@���X�\u001d`hh\b�]��溺��\u001e�UQ\u0000�����\u000f^J�\u000f��Օ�?\u0010����\'4���+s����^\u001a-�\u0003�?\u001eC\u001f\u0010E�ԩS�\u001a\n�\u001d����\u00138�� ����\u001b��(e�\u0002\u000e\u000eb�\u0003\\"��k�d%w����\u0006>�ņ\u0017��6�����%����I0����A4������hJ�\u0000���5L|At�\u0017��\\"�\u0013�:\u0000Ә�/B\u0003��Ky���\u000ep��9��A\u0016�ӦM��\u0005JY\u0005��\u001fda�V-u�s����?Ȧy��\u0017\u0017�\u0002��\u0000\fg����@�\u000e000��?Ȫy���\u0005���9�P�t\u0002(A��-�\u0001���i�����Ab��B���Å�\u0000\f�� ����y;�ٳg�f�\u0013��\u0001$G�\b5̘1#�M3y;\u0000c�\u0005�\u000f>@5L���Q*y;�Ϝ�S\u001e�/z_?sfΧH�\f��3g0�\u0005��t�̙Y��C �\u0018�>�oZs-���\u0000�9}\u001a�;����a֬��&�\u0002p��i\u001a+\u001d��\u0007\u001fj�5k֤G*f�\u0018c���\u001b�A��aPV\u0007���S\u0018��_��q��IàI\u00018u�\u0014�?�w��gϞ\u0018\u0006M\u001a\u00021�Y��\f@R\u0011�T�\u001c\u0001�һ�\u0000~F5��\u0019\u0000��&\u001cz�I5>1\u0007��+���\u0017PE�.�$}��D\u0007`���$\u0000$\u0017��2\u0005@�\u0004\u0018�1Q�\u000e��?(c���s��\'Ob�\u001fT�8gΜ��\u000e��-o�\u0003�\b��x\u0000\u0018ce�\\\u0000@b�7\u0002�\t0�&]��\u0001\u0018o\u0007\u0000*\t_\b����wPM��\u0003Ǐ\u001f�\u000e0��9�\u0018\u000b����BA�c\t\u0014�\u0015\u000e2���\u0004\u0003�AP�\u0012(�+\u0012�ut\u0000P\u0017�@�� �\u0002\u0003�5a\b\u0004J�\u0010\b�FC �\u0003PXP�u\u001cPV�ʋ�\u0001�*��\u0007�a\u0012\fJ\u000b2�\u0001@a�\u0003��\u0010\u0000P\u001av�AiA�`P\u0018�@�4�\tNf>3\u001d@\u0011It\u0000P\u001a\u0002\u0000J�!P7�@��nt\u0000P\u001a\u0005�G�\u001f\u0001��CC�~\u001cPT�1�<|\u0018� P·\u0016,\b\u0018�\u0007\u00180��\u000b�\b���ǣ�ރ� PLz�kt\u0000,��j.�\'�1v\u0002�\u001f\u0014��y�\u0010\b@%�\u000f\u0018\u001ba�\u000e\u001e�J\u0010(c�E\u0001-�M�*\u0014T�4��D\u0000pM\u0010(�����\u000e@��=�\u0002P�D\u0000\u0002��\u000etua\u001e\u0000����%`|Ǡ���)�\u001d\u0006��4�I\u0001`�u!\u0000�s]毗\u0019�n\u001c}�I5\u001eȼ!�����\u000e�\\T\u0001�P�g�,i0�`�w�à�8��C]�_)W\u0000:\u0010\u0000�̯�5\u0004\\"�\u001e{\u001c� 𛾥7�Ԑ���:���\u0002:�A�7Y�\u001f-\u0000X\u0002\u0001\u0000�I��:9�@����.\u0017��*\u0000\u001f�]\u0016��s}��\u001d@��\u0005�q��\u0007r����\u0001H�\u0003\u0012�Y\u001e$7�o��\u0015\u001a\u0002��{�в�2T\u0000H�s��\u0015�|\u001f?o\u0007 Lgq\u0004\u0000$\u0017/��\u000bv\u0000�����>\u0016�\n@B\u0007n]�����.�\u0001H*�\'\u0010\u0000�T�ɯ�h\u0007 �\u001eډ�%A6�U���\u0014��E;�6�\\"D�#(\u0001�H����R\u0007 ;\u0012m�\u0002 ��ֵE����\u000e��o��\u000b�,,���R:\u0000Ilߎ.\u0000�K��[g�쯕�\u0001��\u0015!t\u0001\u0010�峿Vj\u0007 ۶n��0��s��yw}s)�\u0003h�\'ȥ�\u0002-�F\b\u00043P��_+�\u0003��o�\u0012�S�@0�~e�Fw\u0002@�|m3n�\u0004Q�m�ꦬ�\u001d�(y\bd`L�bB\f�(i�oVv\u0007 ���ŭ�൶������\u0019��\u0000څK$Z0\u0014\u0002���3�5��\u0003��]wG0\u0014\u0002�4�￯��yV\u001c\u0000r��M\u0018\n����߲�졏��\u0000�Mwމ�H�[z7?�@Χ<���9�\u0019�Y�?y\u0017\u001bdँJV}2��\u0001ȗ�)�G���b���ͬg|���\u0000�_\\��\u00008�m뷶U<�7�=\u0000d��u�l\u001a�ܶ}��˜��m\u000e`�J�Z����?\u0000v���M�s�\u0003��;ք1)\u0006\u001bФ7�xpG�\u0013?�c\u0001 kV�N!8��\u0000Tиc�C�\u0014��t\u0000�\u001d�Vce\b�\u0015{p�N�V|rq<\u0000d�m+\u0011\u0002(Ul�û\u001d-~ͭ\u0000��+nE\b����=�8^���\u0001 �-_�����·��m��\u0018W\u0003@�\u0010�!\u0004�O���]+~͋\u0000��/�b8\u0004�b���pe�c�I\u0000H���!\u0004`�u<�]׋_�2\u0000䖥7!\u0004\u0010{t��\u0014��u\u0000��7ވ\u001dc5�wx\u001f{�\t�6���<\u0000d�φ���p�\u001a������=O�_\u0013%\u0000d�7�x\bp\u0015��%���?�d�\b�R�\u0000\u0018>���q?�����O�z=��\u000b\u0000���Q���Wh���T׏<���#d\u0000H˵�Ѽ�\u00037�K��V���y���~.�\u0006�pݢO`H$���\u000f�X�!O&�\u0003@�]�0»\u0001V��@�<�g\u000e\u001d��Un�\\"\u0000���|4�\u001f��n �6:N?y�gB��\u0014#M\u0000\f\u001f��G�Ĕ>���\u0017?\u0017��o&]\u0000\f�,X@ݠ\u0015+E��\u0015�ĳ�\u000fW��Z�H\u001b\u0000��)���E���\u001b���\u001fNv���\u000bH\u001d\u0000C�\u0007>\u0018�A�.�;h77~�׿�j���/\u0002`h�?\u001fApV��G�J_�\u0006_\u0005�0���!\b�J\u0017���~��7�2\u0000����\u0011>Q^,�\'��\u0001�������]�\u001b|\u001d\u0000��W�ۘ,�����r��=�\u0007i\'�V)\u0011\u0000�U��\f�\u0010��\u001a�,��\u0002Į��I�M,;(\u0015\u0000�w�\u000b7� ����>~�O�����g�\\��Y��\b󷎨\u0010\u0006��;���g!��t\u0013\u0002���˯�0Dx\u0018�����E���K/*_�f\b@\u0011o��\u0011\u001e��D�H�\u0007t��/�v\u0005�\u000e\b@�����!�O\u0003\u000fE�Õ�\u0001�\\"\u0012*r\u001a������p�/\u0001\u0002`����\u0016\nC�\u0007B��0��9���\u001bgr*�����w��+�i��\u0001p��+�Aan\u0000\u0000\u0000\u0000IEND�B`�"}'
  )
)

assert(!isValidValue('foo'))
assert(!isValidValue('{foo:bar}'))
assert(!isValidValue('{{}}'))
assert(!isValidValue('{♥}')) // unicode
assert(!isValidValue('[string]'))
assert(!isValidValue('+123456'))
assert(!isValidValue('[*]'))
assert(!isValidValue('[1,*]'))
assert(!isValidValue('[*,1]'))
assert(!isValidValue('*'))
assert(!isValidValue("{''':1}"))
assert(!isValidValue('{::1}'))
assert(!isValidValue('{""":1}'))
assert(!isValidValue("{{':1}"))
assert(!isValidValue('a + 1'))
assert(!isValidValue('{foo: "bar"}'))

// getValueType

const _getValueType = (str: string) => getValueType(_specs, str)

assert.equal(_getValueType('"foo"'), 'string')
assert.equal(_getValueType("'foo'"), 'string')
assert.equal(_getValueType('1'), 'number')
// assert.equal(_getValueType(), 'any[]')
assert.equal(_getValueType('[]'), '<T>[]')
assert.equal(_getValueType('-2e-23'), 'number')
assert.equal(_getValueType('/abc/'), 'regex')
assert.equal(_getValueType('true'), 'boolean')
assert.equal(_getValueType('false'), 'boolean')
assert.equal(_getValueType('{}'), '{}')
assert.equal(_getValueType('{a:1,b:2}'), '{a:number,b:number}')
assert.equal(
  _getValueType(
    `'{ "error": {  "errors": [   {    "domain": "global",    "reason": "required",    "message": "Login Required",    "locationType": "header",    "location": "Authorization"   }  ],  "code": 401,  "message": "Login Required" }}'`
  ),
  'string'
)

// findGenerics

assert.deepEqual(findGenerics('"foo"'), new Set())
assert.deepEqual(findGenerics('<T>'), new Set(['<T>']))
assert.deepEqual(findGenerics('<T>[]'), new Set(['<T>']))
assert.deepEqual(findGenerics('{foo:<T>,bar:<K>}'), new Set(['<T>', '<K>']))
assert.deepEqual(findGenerics('`V<T>`'), new Set(['<T>']))
assert.deepEqual(findGenerics('`V`'), new Set())
assert.deepEqual(findGenerics('`EE`'), new Set())

// extractGenerics

const _extractGenerics = (value: string, type: string) =>
  extractGenerics(_specs, value, type)

assert.deepEqual(_extractGenerics('number', '<T>'), { '<T>': 'number' })
assert.deepEqual(_extractGenerics('"foo"', '<T>'), { '<T>': 'string' })
assert.deepEqual(_extractGenerics('1', '<T>'), { '<T>': 'number' })
assert.deepEqual(_extractGenerics('{foo:"bar"}', '<T>'), {
  '<T>': '{foo:string}',
})
assert.deepEqual(_extractGenerics('{foo:"bar"}', '{foo:<T>}'), {
  '<T>': 'string',
})
assert.deepEqual(_extractGenerics('<0>[]', '<1>[]'), { '<1>': '<0>' })
assert.deepEqual(_extractGenerics('number|string', '<0>'), {
  '<0>': 'number|string',
})
assert.deepEqual(_extractGenerics('<0>|<1>', '<2>'), { '<2>': '<0>|<1>' })
assert.deepEqual(_extractGenerics('`V<{value:string}>`', '`V<T>`'), {
  '<T>': '{value:string}',
})

// applyGenerics

assert.equal(applyGenerics('<T>', {}), '<T>')
assert.equal(applyGenerics('<T>', { '<T>': 'string' }), 'string')
assert.equal(applyGenerics('<T>[]', { '<T>': 'string' }), 'string[]')
assert.equal(
  applyGenerics('{foo:<A>,bar:<B>}', {
    '<A>': 'object',
    '<B>': 'string',
  }),
  '{foo:object,bar:string}'
)
assert.equal(applyGenerics('<T>', { '<T>': '`CH`' }), '`CH`')
assert.equal(applyGenerics('`V<T>`', { '<T>': '{}' }), '`V<{}>`')
assert.equal(applyGenerics('`V<T>`', { '<T>': '<A>' }), '`V<A>`')

assert.equal(getNodeAtPath('', [1]), undefined)
assert.equal(getNodeAtPath('"foo"', []), '"foo"')
assert.equal(getNodeAtPath('[0,1,2,3]', []), '[0,1,2,3]')
assert.equal(getNodeAtPath('[0,1,2,3]', [1]), '1')
assert.equal(getNodeAtPath('{foo:"bar"}', []), '{foo:"bar"}')
assert.equal(getNodeAtPath('{foo:"bar"}', [0]), 'foo:"bar"')
assert.equal(getNodeAtPath('{foo:"bar"}', [0, 0]), 'foo')
assert.equal(getNodeAtPath('string[][]', [0]), 'string[]')
assert.equal(getNodeAtPath('string[][]', [0, 0]), 'string')

// getParent

assert.equal(getParent('"foo"', []), undefined)
assert.equal(getParent('{foo:"bar zaz"}', []), undefined)
assert.equal(getParent('{foo:"bar zaz"}', [0]), '{foo:"bar zaz"}')
assert.equal(getParent('{foo:"bar zaz"}', [0, 0]), 'foo:"bar zaz"')
assert.equal(getParent('{foo:"bar zaz"}', [0, 1]), 'foo:"bar zaz"')

// getNextNodePath

assert.deepEqual(getNextNodePath('"foo"', [], 1), undefined)
assert.deepEqual(getNextNodePath('"foo"', [], -1), undefined)
assert.deepEqual(getNextNodePath('[0,1,2,3]', [], 1), [0])
assert.deepEqual(getNextNodePath('[0,1,2,3]', [1], 1), [2])
assert.deepEqual(getNextNodePath('[0,1,2,3]', [1], -1), [0])
assert.deepEqual(getNextNodePath('{foo:"bar"}', [0], 1), [0, 0])
assert.deepEqual(getNextNodePath('{foo:"bar"}', [0], -1), [])
assert.deepEqual(getNextNodePath('{foo:"bar"}', [0, 0], 1), [0, 1])

// getNextNode

assert.equal(getNextNode('"foo"', [], 1), undefined)
assert.equal(getNextNode('"foo"', [], -1), undefined)
assert.equal(getNextNode('[0,1,2,3]', [1], 1), '2')
assert.equal(getNextNode('[0,1,2,3]', [1], -1), '0')
assert.equal(getNextNode('{foo:"bar"}', [0], 1), 'foo')
assert.equal(getNextNode('{foo:"bar"}', [0], -1), '{foo:"bar"}')
assert.equal(getNextNode('{foo:"bar"}', [0, 0], 1), '"bar"')

// getNextLeafPath

assert.deepEqual(getNextLeafPath('"foo"', [], 1), undefined)
assert.deepEqual(getNextLeafPath('"foo"', [], -1), undefined)
assert.deepEqual(getNextLeafPath('[0,1,2,3]', [], 1), [0])
assert.deepEqual(getNextLeafPath('[0,1,2,3]', [1], 1), [2])
assert.deepEqual(getNextLeafPath('[0,1,2,3]', [1], -1), [0])
assert.deepEqual(getNextLeafPath('{foo:"bar"}', [], 1), [0, 0])
assert.deepEqual(getNextLeafPath('{foo:"bar"}', [0], 1), [0, 0])
assert.deepEqual(getNextLeafPath('{foo:"bar"}', [0], -1), undefined)
assert.deepEqual(getNextLeafPath('{foo:"bar"}', [0, 0], 1), [0, 1])
assert.deepEqual(getNextLeafPath('{foo:"bar",}', [1], -1), [0, 1])
assert.deepEqual(getNextLeafPath('{foo:{bar:"zaz"},}', [1], -1), [0, 1, 0, 1])

// getLastLeaf

assert.deepEqual(getLastLeafPath('{}'), [])
assert.deepEqual(getLastLeafPath('{foo:"bar"}'), [0, 1])

// insertNodeAt

assert.equal(insertNodeAt('[0,1,2,3]', [2], '"foo"'), '[0,1,"foo",2,3]')
assert.equal(
  insertNodeAt('{foo:"bar zaz"}', [0], 'no:"flow"'),
  '{no:"flow",foo:"bar zaz"}'
)
assert.equal(insertNodeAt('[]', [0], '1'), '[1]')
assert.equal(updateNodeAt('{a:}', [0, 1], '1'), '{a:1}')

// updateNodeAt

assert.equal(updateNodeAt('"foo"', [], '"bar"'), '"bar"')
assert.equal(updateNodeAt('[0,1,2,3]', [2], '"foo"'), '[0,1,"foo",3]')
assert.equal(updateNodeAt('{foo:"bar zaz"}', [0, 0], '1'), '{1:"bar zaz"}')
assert.equal(updateNodeAt('[]', [0], '1'), '[1]')
assert.equal(updateNodeAt('{a:}', [0, 1], '1'), '{a:1}')

// removeNodeAt

assert.equal(removeNodeAt('"foo"', []), '')
assert.equal(removeNodeAt('[0,1,2,3]', [0]), '[1,2,3]')
assert.equal(removeNodeAt('{foo:"bar zaz"}', [0]), '{}')
assert.equal(removeNodeAt('{foo:}', [0, 1]), '{foo}')

// evaluate

const _evaluate = (str: string) => evaluate(str, _specs, _classes)

assert.deepEqual(_evaluate('1'), 1)
assert.deepEqual(_evaluate('Infinity'), Infinity)
assert.deepEqual(_evaluate('"foo"'), 'foo')
assert.deepEqual(_evaluate("'foo'"), 'foo')
assert.deepEqual(_evaluate('\'"foo"\''), '"foo"')
// assert.deepEqual(_evaluate("'\\'foo\\''"), "'foo'")
assert.deepEqual(_evaluate('\'\\"foo\\"\''), '"foo"')
assert.deepEqual(_evaluate('"\\"foo\\""'), '"foo"')
assert.deepEqual(_evaluate('"\\"\\\\\\"foo\\\\\\"\\""'), '"\\"foo\\""')
// assert.deepEqual(_evaluate('"\\"\\\\"foo\\\\"\\""'), '"\\"foo\\""')
assert.deepEqual(_evaluate("'\\\\'"), '\\')
// assert.deepEqual(_evaluate("'\\'\\\\\\''"), "'\\'")
assert.deepEqual(_evaluate('"\\""'), '"')
assert.deepEqual(_evaluate('"\\"input/a\\""'), '"input/a"')
assert.deepEqual(_evaluate('true'), true)
assert.deepEqual(_evaluate('false'), false)
assert.deepEqual(_evaluate('null'), null)
assert.deepEqual(_evaluate('[]'), [])
assert.deepEqual(_evaluate('[1,2,3]'), [1, 2, 3])
assert.deepEqual(_evaluate('[1,2,3,]'), [1, 2, 3])
assert.deepEqual(_evaluate('{foo:0}'), { foo: 0 })
assert.deepEqual(_evaluate('{foo:0,}'), { foo: 0 })
assert.deepEqual(_evaluate('{foo:"bar zaz"}'), { foo: 'bar zaz' })
assert.deepEqual(_evaluate('{a:1}'), { a: 1 })
assert.deepEqual(_evaluate('{a:"1"}'), { a: '1' })
assert.deepEqual(_evaluate('{1:1}'), { 1: 1 })
assert.deepEqual(_evaluate('{a}'), { a: 'a' })
assert.deepEqual(_evaluate('{a,b}'), { a: 'a', b: 'b' })
assert.deepEqual(_evaluate('{a,}'), { a: 'a' })
assert.deepEqual(_evaluate('{1}'), { 1: '1' })
assert.deepEqual(_evaluate('"\n"'), '\n')
assert.deepEqual(
  _evaluate(`\${unit:{id:'${ID_IDENTITY}'}}`).__bundle.unit.id,
  ID_IDENTITY
)
assert.deepEqual(
  _evaluate(
    `'{\n "error": {\n  "errors": [\n   {\n    "domain": "global",\n    "reason": "required",\n    "message": "Login Required",\n    "locationType": "header",\n    "location": "Authorization"\n   }\n  ],\n  "code": 401,\n  "message": "Login Required"\n }\n}\n'`
  ),
  '{\n "error": {\n  "errors": [\n   {\n    "domain": "global",\n    "reason": "required",\n    "message": "Login Required",\n    "locationType": "header",\n    "location": "Authorization"\n   }\n  ],\n  "code": 401,\n  "message": "Login Required"\n }\n}\n'
)

// isGeneric

assert(hasGeneric('<T>'))
assert(hasGeneric('<0>'))
assert(hasGeneric('<0>[]'))
assert(hasGeneric('`V<T>`'))
assert(hasGeneric('`V`&<T>'))
assert(hasGeneric('<T>&`V`'))

// matchAllType

const _matchAllExcTypes = (types: string[], excTypes: string[]) =>
  matchAllExcTypes(system.specs, types, excTypes)

assert(isEqual(_matchAllExcTypes(['any'], ['any']), [[[0, 0]]]))
assert(isEqual(_matchAllExcTypes(['string'], ['any']), [[[0, 0]]]))
assert(isEqual(_matchAllExcTypes(['any'], ['string']), [[[0, 0]]]))
assert(isEqual(_matchAllExcTypes(['number'], ['string']), []))
assert(
  isEqual(_matchAllExcTypes(['number', 'number'], ['<T>']), [
    [[0, 0]],
    [[1, 0]],
  ])
)
assert(
  isEqual(_matchAllExcTypes(['number', 'number'], ['number']), [
    [[0, 0]],
    [[1, 0]],
  ])
)
assert(isEqual(_matchAllExcTypes(['number', 'string'], ['number']), [[[0, 0]]]))

assert.deepEqual(
  evaluateBundleStr(
    "${unit:{id:'dc5852d3-b212-48ee-9f05-6ea2de2ef515',input:{},output:{},memory:{input:{},output:{},memory:{unit:{},merge:{},exposedMerge:{},waitAll:{input:'{}',output:'{}',memory:'{__buffer:[],_forwarding:false,_backwarding:false,_forwarding_empty:false,_looping:false}'}}}},specs:{\"dc5852d3-b212-48ee-9f05-6ea2de2ef515\":{type:'`U`&`G`&`C`',name:'untitled',units:{},merges:{},inputs:{},outputs:{},metadata:{icon:null,description:''},id:'dc5852d3-b212-48ee-9f05-6ea2de2ef515'}}}",
    system.specs,
    system.classes
  ),
  {
    unit: {
      id: 'dc5852d3-b212-48ee-9f05-6ea2de2ef515',
      input: {},
      output: {},
      memory: {
        input: {},
        output: {},
        memory: {
          unit: {},
          merge: {},
          exposedMerge: {},
          waitAll: {
            input: '{}',
            output: '{}',
            memory:
              '{__buffer:[],_forwarding:false,_backwarding:false,_forwarding_empty:false,_looping:false}',
          },
        },
      },
    },
    specs: {
      'dc5852d3-b212-48ee-9f05-6ea2de2ef515': {
        type: '`U`&`G`&`C`',
        name: 'untitled',
        units: {},
        merges: {},
        inputs: {},
        outputs: {},
        metadata: { icon: null, description: '' },
        id: 'dc5852d3-b212-48ee-9f05-6ea2de2ef515',
      },
    },
  }
)

// assert(
//   isTypeMatch(
//     system,
//     "${unit:{id:'dc5852d3-b212-48ee-9f05-6ea2de2ef515',input:{},output:{},memory:{input:{},output:{},memory:{unit:{},merge:{},exposedMerge:{},waitAll:{input:'{}',output:'{}',memory:'{__buffer:[],_forwarding:false,_backwarding:false,_forwarding_empty:false,_looping:false}'}}}},specs:{\"dc5852d3-b212-48ee-9f05-6ea2de2ef515\":{type:'`U`&`G`&`C`',name:'untitled',units:{},merges:{},inputs:{},outputs:{},metadata:{icon:null,description:''},id:'dc5852d3-b212-48ee-9f05-6ea2de2ef515'}}}",
//     '`G`'
//   )
// )

// assert(
//   _getTypeTree(
//     '{name:"cybermilla 0",inputs:{},outputs:{click:{plug:{0:{unitId:"onclick",pinId:"event"},1:{unitId:"onclick0",pinId:"event"},2:{unitId:"onclick1",pinId:"event"}}}},units:{cybermillabutton:{id:"91bbfe94-8960-4ef0-946d-d786a8dfceb6",input:{style:{data:"{background:\\"#FD5F55\\",background:\\"radial-gradient(ellipse at center, #ffffff -100%, #FD5F55 50%)\\"}\\"},value:{data:"\\"Fashion\\""}},output:{},metadata:{component:{width:274.7310791015625,height:122.5975341796875},position:{x:-550,y:57}}},cybermillabutton0:{id:"91bbfe94-8960-4ef0-946d-d786a8dfceb6",input:{style:{data:"{background:\\"#A6496A\\",background:\\"radial-gradient(ellipse at center, #ffffff -100%, #A6496A 50%)\\"}"},value:{data:"\\"Design"\\"}}},onclick:{id:"97c94516-add1-11ea-ba72-8f55299b735c",input:{element:{}},output:{event:{}},metadata:{position:{x:-368,y:57}}},onclick0:{id:"97c94516-add1-11ea-ba72-8f55299b735c",input:{element:{}},output:{event:{}},metadata:{position:{x:93,y:62}}},onclick1:{id:"97c94516-add1-11ea-ba72-8f55299b735c",input:{element:{}},output:{event:{}},metadata:{position:{x:343,y:39}}}},merges:{0:{onclick:{input:{element:true}},cybermillabutton:{output:{_self:true}}},1:{onclick0:{input:{element:true}},cybermillabutton0:{output:{_self:true}}},2:{onclick1:{input:{element:true}},cybermillabutton1:{output:{_self:true}}}},render:true,component:{subComponents:{box:{children:["box4"],childSlot:{box4:"default"}},box4:{children:["image","textdiv","textdiv0","box5"],childSlot:{image:"default",textdiv:"default",textdiv0:"default",box5:"default"}},box5:{children:["cybermillabutton","cybermillabutton0","cybermillabutton1"],childSlot:{cybermillabutton:"default",cybermillabutton0:"default",cybermillabutton1:"default"}},textdiv:{children:[]},textdiv0:{children:[]},image:{children:[]},cybermillabutton:{children:[]},cybermillabutton0:{children:[]},cybermillabutton1:{children:[]}},children:["box"],defaultWidth:480,defaultHeight:690},metadata:{complexity:26},type:"`U`&`G`&`C`",id:"56304648-a9f7-483b-ac7d-2bc63f0bf67f"}'
//   )
// )

assert(
  isValidValue(
    `\${unit:{id:"9988a56e-6bee-46c8-864c-e351d84bc7e2",input:{value:{data:"\\"\\n\\nThis is indeed a test\\""}}}}`
  )
)

assert.equal(_evaluate('"\n"'), '\n')
assert.equal(_evaluate('"\\"\\n\\""'), '"\\n"')

assert(
  isValidValue(
    '${unit:{id:"9f1e9240-08d7-46f4-bb57-11de177b987f"},specs:{"9f1e9240-08d7-46f4-bb57-11de177b987f":{name:"empty",units:{unit:{id:"6f0be5f2-bc6f-4f68-8826-91b69c4aacb7",input:{},output:{}}},merges:{},inputs:{},outputs:{},metadata:{icon:null,description:"empty graph",complexity:2,tags:["core"]},id:"9f1e9240-08d7-46f4-bb57-11de177b987f",type:"`U`&`G`",system:true},"6f0be5f2-bc6f-4f68-8826-91b69c4aacb7":{type:"`U`&`G`",name:"untitled",units:{textarea:{id:"83ec6688-b80b-4ef2-861f-14245ef392c0",input:{value:{ignored:false,constant:false},style:{ignored:false,constant:true,data:"{fontSize:\\"14px\\"}",metadata:{position:{x:52,y:-34}}},placeholder:{ignored:true,constant:false,metadata:{position:{x:52,y:-61}}}},output:{value:{ignored:true,constant:false,metadata:{position:{x:311,y:9}}}},metadata:{position:{x:178,y:9}}},spark:{id:"3be8272d-310a-4aa2-84a1-71f590a8227a",input:{a:{ignored:false,constant:true,data:"\\"M50 100 a 50  50 1 1 1 0 1z M50 100 a 50  50 1, 1, 1, 0, 1M 96 100 a 4  4 1 1 1 0 1M 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \n\nM 100 100 m 25 -25 l 25 -25 m -10 -10 a 60 60 0 0 1 20 20 \nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \n\nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \nM 100 100 m 25 25 l 25 25 m 10 -10 a 60 60 1 0 1 -20 20\n\nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \n\nM 100 100 m -25 25 l -25 25 m 10 10 a 60 60 1 0 1 -20 -20 \nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \n\nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \nM 100 100 m -25 -25 l -25 -25 m -10 10 a 60 60 0 0 1 20 -20\\""}},output:{a:{ignored:false,constant:false}},metadata:{position:{x:13,y:95}}},onvalue:{id:"d0e6f14c-400c-42f3-bfd6-1bbe0146f490",input:{element:{constant:false,ignored:false}},output:{event:{constant:false,ignored:false,data:"\\"M50 100 a 50  50 1 1 1 0 1z \nM50 100 a 50  50 1, 1, 1, 0, 1\n\nM 96 100 a 4  4 1 1 1 0 1\n\nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \n\nM 100 100 m 25 -25 l 25 -25 m -10 -10 a 60 60 0 0 1 20 20 \nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \n\nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \nM 100 100 m 25 25 l 25 25 m 10 -10 a 60 60 1 0 1 -20 20\n\nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \n\nM 100 100 m -25 25 l -25 25 m 10 10 a 60 60 1 0 1 -20 -20 \nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \n\nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \nM 100 100 m -25 -25 l -25 -25 m -10 10 a 60 60 0 0 1 20 -20\\""}},metadata:{position:{x:22,y:4}}},removenewline:{id:"1a0773eb-559c-47e2-81d7-fc28bc80076d",input:{str:{constant:false,ignored:false,data:"\\"M50 100 a 50  50 1 1 1 0 1z \nM50 100 a 50  50 1, 1, 1, 0, 1\n\nM 96 100 a 4  4 1 1 1 0 1\n\nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \n\nM 100 100 m 25 -25 l 25 -25 m -10 -10 a 60 60 0 0 1 20 20 \nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \n\nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \nM 100 100 m 25 25 l 25 25 m 10 -10 a 60 60 1 0 1 -20 20\n\nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \n\nM 100 100 m -25 25 l -25 25 m 10 10 a 60 60 1 0 1 -20 -20 \nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \n\nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \nM 100 100 m -25 -25 l -25 -25 m -10 10 a 60 60 0 0 1 20 -20\\""}},output:{str:{constant:false,ignored:false,data:"\\"M50 100 a 50  50 1 1 1 0 1z M50 100 a 50  50 1, 1, 1, 0, 1\n\nM 96 100 a 4  4 1 1 1 0 1\n\nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \nM 100 100 m 0 -30 l 0 -50 m -25 5 a 60 60 1 0 1 50 1 \n\nM 100 100 m 25 -25 l 25 -25 m -10 -10 a 60 60 0 0 1 20 20 \nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \n\nM 100 100 m 30 0 l 50 0 m -5 -25 a 60 60 1 0 1 0 50 \nM 100 100 m 25 25 l 25 25 m 10 -10 a 60 60 1 0 1 -20 20\n\nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \nM 100 100 m 0 30 l 0 50 m 25 -5 a 60 60 1 0 1 -50 0 \n\nM 100 100 m -25 25 l -25 25 m 10 10 a 60 60 1 0 1 -20 -20 \nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \n\nM 100 100 m -30 0 l -50 0 m 5 25 a 60 60 0 0 1 0 -50 \nM 100 100 m -25 -25 l -25 -25 m -10 10 a 60 60 0 0 1 20 -20\\""}},metadata:{position:{x:-57,y:50}}},untitled:{id:"79c37c2e-4a2b-445f-af75-5599cc6bf31c",metadata:{position:{x:-183,y:-34}},input:{style:{metadata:{position:{x:-53,y:-62}},constant:true,data:"{fill:\\"currentColor\\",fillRule:\\"evenodd\\",strokeWidth:\\"6px\\",strokeLinecap:\\"round\\"}"},d:{}},output:{}}},merges:{0:{textarea:{output:{_self:true}},onvalue:{input:{element:true}}},1:{spark:{output:{a:true}},textarea:{input:{value:true}}},2:{spark:{input:{a:true}},removenewline:{output:{str:true}}},3:{removenewline:{input:{str:true}},onvalue:{output:{event:true}},untitled:{input:{d:true}}}},inputs:{},outputs:{},metadata:{icon:null,description:"",complexity:22,position:{merge:{1:{x:52,y:67},2:{x:-34,y:91},3:{x:-40,y:4}}}},id:"6f0be5f2-bc6f-4f68-8826-91b69c4aacb7",component:{subComponents:{textarea:{},untitled:{}},children:["textarea","untitled"],defaultWidth:200,defaultHeight:150}}}}'
  )
)
